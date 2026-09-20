import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findById(currentUser.id).select('role applicationStatus');
    const latestApp = await Application.findOne({ applicant: currentUser.id }).sort({ createdAt: -1 });

    let status = 'not_applied';
    if (user?.role === 'member' || user?.role === 'officer' || user?.role === 'super_admin' || user?.role === 'teacher' || user?.role === 'adviser') {
      status = 'approved';
    } else if (latestApp) {
      status = latestApp.status;
    } else if (user?.role === 'applicant') {
      status = 'pending';
    }

    return NextResponse.json({
      status,
      hasApplication: Boolean(latestApp),
      application: latestApp || null,
      role: user?.role || currentUser.role,
    });
  } catch (err) {
    console.error('Check application status error:', err);
    return NextResponse.json(
      { error: 'Failed to check application status: ' + err.message },
      { status: 500 }
    );
  }
}
