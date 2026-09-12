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

    const validRoles = ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member', 'applicant', 'user'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (['super_admin', 'teacher', 'adviser'].includes(role)) {
      if (promoter.role !== 'super_admin') {
        return NextResponse.json({ error: 'Only a system admin can grant staff or admin access.' }, { status: 403 });
      }

      if (role !== 'super_admin' && targetUser.accountType !== role) {
        return NextResponse.json({ error: 'The requested staff role does not match this account type.' }, { status: 400 });
      }
    }

    if (role === 'officer') {
      const isTeacher = ['teacher', 'adviser'].includes(promoter.role);
      const isAdmin = ['super_admin'].includes(promoter.role);
      const isPresident = promoter.role === 'officer' && promoter.officerPosition === 'president';
      if (!isTeacher && !isAdmin && !isPresident) {
        return NextResponse.json(
          { error: 'Only a teacher, president, or admin can assign officer roles' },
          { status: 403 }
        );
      }
    }

    if (role === 'alumni') {
      const canApproveAlumni = ['teacher', 'adviser', 'officer', 'super_admin'].includes(promoter.role);
      if (!canApproveAlumni) {
        return NextResponse.json(
          { error: 'Only officers, teachers, advisers, or admins can approve alumni status' },
          { status: 403 }
        );
      }
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (['teacher', 'adviser'].includes(role)) updateData.staffApprovalStatus = 'approved';
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
