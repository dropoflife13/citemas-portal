import { NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const canView = [
    'super_admin',
    'teacher',
    'adviser',
    'officer',
    'alumni',
    'member',
  ].includes(currentUser.role);

  if (!canView) {
    return NextResponse.json(
      {
        message:
          'You do not have permission to view the member directory',
      },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    // Exclude super_admin from the directory (anonymize)
    const users = await User.find({
      role: { $nin: ['super_admin'] },
    })
      .select(
        'firstName lastName email role officerPosition yearLevel department specialization bio phone graduationYear avatar'
      )
      .sort({ role: 1, lastName: 1 })
      .lean(); // return plain objects (easier to serialize)

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Fetch directory error:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch directory: ' + error.message,
      },
      { status: 500 }
    );
  }
}