import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();

    const promoter = await User.findById(currentUser.id);
    if (!promoter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const { role, officerPosition, graduationYear } = await req.json();

    const validRoles = ['super_admin', 'teacher', 'officer', 'alumni', 'member', 'applicant', 'user'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (role === 'officer') {
      const isTeacher = promoter.role === 'teacher';
      const isPresident = promoter.role === 'officer' && promoter.officerPosition === 'president';
      if (!isTeacher && !isPresident) {
        return NextResponse.json(
          { error: 'Only a teacher or the president can assign officer roles' },
          { status: 403 }
        );
      }
    }

    if (role === 'alumni') {
      const canApproveAlumni = ['teacher', 'officer', 'super_admin'].includes(promoter.role);
      if (!canApproveAlumni) {
        return NextResponse.json(
          { error: 'Only officers, teachers, or admins can approve alumni status' },
          { status: 403 }
        );
      }
    }

    const updateData = {};
    if (role) updateData.role = role;
    updateData.officerPosition = role === 'officer' ? (officerPosition || null) : null;
    if (role === 'alumni' && graduationYear) updateData.graduationYear = graduationYear;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}