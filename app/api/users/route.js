import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const canView = ['super_admin', 'teacher', 'officer', 'alumni', 'member'].includes(currentUser.role);
  if (!canView) {
    return NextResponse.json({ error: 'You do not have permission to view the member directory' }, { status: 403 });
  }

  await connectDB();
  const users = await User.find().select('-password');
  return NextResponse.json(users);
}