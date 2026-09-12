import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  passwordResetCodeMatches,
  PASSWORD_RESET_MAX_ATTEMPTS,
} from '@/lib/passwordReset';
import { passwordResetConfirmSchema } from '@/lib/validators';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const INVALID_CODE_MESSAGE = 'That verification code is invalid or has expired. Request a new code and try again.';

export async function POST(req) {
  try {
    const parsed = passwordResetConfirmSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid password reset request.' }, { status: 400 });
    }

    const { email, code, password } = parsed.data;
    await connectDB();
    const user = await User.findOne({ email }).select('+passwordResetCodeHash +passwordResetExpiresAt +passwordResetAttempts');
    const expired = !user?.passwordResetExpiresAt || user.passwordResetExpiresAt <= new Date();
    const matched = !expired && user && passwordResetCodeMatches(email, code, user.passwordResetCodeHash);

    if (!matched) {
      if (user && !expired) {
        user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
        if (user.passwordResetAttempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
          user.passwordResetCodeHash = undefined;
          user.passwordResetExpiresAt = undefined;
          user.passwordResetAttempts = 0;
        }
        await user.save();
      }
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
    }

    user.password = password;
    user.passwordResetCodeHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.passwordResetAttempts = 0;
    await user.save();

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Password reset confirmation failed:', error);
    return NextResponse.json({ error: 'Unable to reset the password. Please request a new code.' }, { status: 500 });
  }
}
