import { NextResponse } from 'next/server';

import connectDB from '@/lib/mongodb';
import { requireFreshUser } from '@/lib/permissions';
import User from '@/models/User';

export async function GET(req) {
  const { user: fresh, error, status } = await requireFreshUser(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  const canView = [
    'super_admin',
    'teacher',
    'adviser',
    'officer',
    'alumni',
    'member',
  ].includes(fresh.role);

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

    const isManager = ['super_admin', 'teacher', 'adviser', 'officer'].includes(fresh.role);
    const query = isManager ? {} : { role: { $in: ['member', 'alumni', 'officer', 'teacher', 'adviser'] } };
    const users = await User.find(query)


      .select(
        'firstName lastName email role officerPosition yearLevel department specialization bio graduationYear avatar staffId accountType staffApprovalStatus studentId createdAt'
      )
      .sort({ role: 1, lastName: 1 })
      .lean(); // return plain objects (easier to serialize)

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Fetch directory error:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch directory',
      },
      { status: 500 }
    );
  }
}