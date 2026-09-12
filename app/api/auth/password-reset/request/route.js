import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetCode } from '@/lib/mailer';
import {
  createPasswordResetCode,
  hashPasswordResetCode,
  PASSWORD_RESET_RESEND_DELAY_MS,
  PASSWORD_RESET_TTL_MS,
} from '@/lib/passwordReset';
import { passwordResetRequestSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GENERIC_MESSAGE = 'If an eligible CITEMAS account exists for that email, a verification code has been sent.';

export async function POST(req) {
  try {
    const parsed = passwordResetRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid recovery request.' }, { status: 400 });
    }

    const { email } = parsed.data;
    await connectDB();
    const user = await User.findOne({ email }).select('+passwordResetLastRequestedAt');

    if (!user) return NextResponse.json({ message: GENERIC_MESSAGE });

    const now = new Date();
    if (user.passwordResetLastRequestedAt && now - user.passwordResetLastRequestedAt < PASSWORD_RESET_RESEND_DELAY_MS) {
      return NextResponse.json({ message: 'Please wait one minute before requesting another code.' }, { status: 429 });
    }

    const code = createPasswordResetCode();
    user.passwordResetCodeHash = hashPasswordResetCode(email, code);
    user.passwordResetExpiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
    user.passwordResetAttempts = 0;
    user.passwordResetLastRequestedAt = now;
    await user.save();

    try {
      await sendPasswordResetCode({ to: email, code });
    } catch (mailError) {
      // Do not leave a code active when delivery did not succeed.
      user.passwordResetCodeHash = undefined;
      user.passwordResetExpiresAt = undefined;
      user.passwordResetAttempts = 0;
      user.passwordResetLastRequestedAt = undefined;
      await user.save();
      throw mailError;
    }
    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('Password reset code request failed:', error);
    const message = error instanceof Error ? error.message : 'Unable to send a verification code.';
    const status = message.includes('configured') ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? message : 'Unable to send a verification code. Please try again.' }, { status });
  }
}
