import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  passwordResetCodeMatches,
  PASSWORD_RESET_MAX_ATTEMPTS,
} from '@/lib/passwordReset';
import { passwordResetConfirmSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const INVALID_CODE_MESSAGE = 'That verification code is invalid or has expired. Request a new code and try again.';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const ipLimit = rateLimit(`pwreset-confirm:ip:${ip}`, { limit: 15, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSec) } }
      );
    }

    const parsed = passwordResetConfirmSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid password reset request.' }, { status: 400 });
    }

    const { email, code, password } = parsed.data;
    const emailLimit = rateLimit(`pwreset-confirm:email:${email}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: 'Too many verification attempts for this account. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSec) } }
      );
    }
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
    user.tokenVersion = (user.tokenVersion || 0) + 1;
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
