import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const canView = ['super_admin', 'teacher', 'officer', 'alumni', 'member'].includes(currentUser.role);
  if (!canView) {
    return NextResponse.json({ message: 'You do not have permission to view the member directory' }, { status: 403 });
  }

  try {
    await connectDB();
    const users = await User.find({})
      .select('firstName lastName email role officerPosition yearLevel department specialization bio phone graduationYear')
      .sort({ role: 1, lastName: 1 });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch directory: ' + error.message }, { status: 500 });
  }
}