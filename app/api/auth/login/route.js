import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logActivity';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const ipLimit = rateLimit(`login:ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSec) } }
      );
    }

    await connectDB();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid login payload' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const emailLimit = rateLimit(`login:email:${email}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts for this account. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSec) } }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = generateToken(user);

    // ─── Log the login ───
    await logActivity({
      req,
      actor: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      action: 'auth.login',
      targetType: 'User',
      targetId: user._id,
      targetName: `${user.firstName} ${user.lastName}`,
    });

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        applicationStatus: user.applicationStatus,
        accountType: user.accountType,
        staffApprovalStatus: user.staffApprovalStatus,
        officerPosition: user.officerPosition,
        studentId: user.studentId,
        staffId: user.staffId,
        yearLevel: user.yearLevel,
        department: user.department,
        specialization: user.specialization,
      }
    });
  } catch (err) {
    console.error('[login] error:', {
      message: err?.message,
      code: err?.code,
      name: err?.name,
    });
    return NextResponse.json({ error: 'Unable to sign in. Please try again.' }, { status: 500 });
  }
}