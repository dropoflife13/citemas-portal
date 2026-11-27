import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const authResult = verifyAuth(req);
    if (authResult.success && authResult.user?.id) {
      await connectDB();
      await User.findByIdAndUpdate(authResult.user.id, {
        $inc: { tokenVersion: 1 },
      });
    }

    const res = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    res.cookies.set('citemas_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return res;
  } catch (err) {
    console.error('[logout] error:', err);
    return NextResponse.json({ error: 'Unable to log out.' }, { status: 500 });
  }
}
