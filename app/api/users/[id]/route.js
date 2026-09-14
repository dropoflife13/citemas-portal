import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logActivity';

// Only these roles can delete users
const ALLOWED_ROLES = ['super_admin'];
const MANAGE_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];

const VALID_ROLES = ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member', 'applicant', 'user'];
const VALID_POSITIONS = [
  'president', 'vice_president', 'secretary', 'treasurer',
  'pro', 'events_director', 'creative_director', 'year_level_representative',
];

export async function PATCH(req, { params }) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  if (!MANAGE_ROLES.includes(currentUser.role)) {
    return NextResponse.json(
      { message: 'You do not have permission to update user roles' },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Missing user id' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { role, officerPosition } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { message: `Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    if (role === 'officer' && officerPosition && !VALID_POSITIONS.includes(officerPosition)) {
      return NextResponse.json(
        { message: `Officer position must be one of: ${VALID_POSITIONS.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    // Prevent duplicate officer positions (e.g. two presidents)
    if (role === 'officer' && officerPosition) {
      const existing = await User.findOne({
        _id: { $ne: id },
        role: 'officer',
        officerPosition,
      }).select('_id firstName lastName');

      if (existing) {
        return NextResponse.json(
          { message: `${officerPosition.replace(/_/g, ' ')} is already assigned to ${existing.firstName} ${existing.lastName}. Remove that assignment first.` },
          { status: 409 }
        );
      }
    }

    const updates = {
      role,
      officerPosition: role === 'officer' ? officerPosition || null : null,
    };

    // Staff roles get approved automatically
    if (role === 'teacher' || role === 'adviser') {
      updates.staffApprovalStatus = 'approved';
    }

    const updated = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
      .select('firstName lastName email role officerPosition staffApprovalStatus')
      .lean();

    if (!updated) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    await logActivity({
      req,
      actor: currentUser,
      action: 'user.role_updated',
      targetType: 'User',
      targetId: id,
      targetName: `${updated.firstName} ${updated.lastName}`,
      metadata: { newRole: role, officerPosition: updates.officerPosition },
    });

    return NextResponse.json({ message: 'User role updated', user: updated });
  } catch (err) {
    console.error('Update user role error:', err);
    return NextResponse.json(
      { message: 'Failed to update user role: ' + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(currentUser.role)) {
    return NextResponse.json(
      { message: 'Only super admins can delete users' },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: 'Missing user id' }, { status: 400 });
  }

  // Prevent self-delete
  const currentUserId = String(currentUser.id || currentUser._id);
  if (String(id) === currentUserId) {
    return NextResponse.json(
      { message: 'You cannot delete your own account' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const target = await User.findById(id)
      .select('firstName lastName email role')
      .lean();

    if (!target) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // Also clean up their activity logs (optional — remove if you want to keep history)
    // await ActivityLog.deleteMany({ actor: id });

    // Log the deletion
    await logActivity({
      req,
      actor: currentUser,
      action: 'user.deleted',
      targetType: 'User',
      targetId: id,
      targetName: `${target.firstName} ${target.lastName}`,
      metadata: {
        deletedEmail: target.email,
        deletedRole: target.role,
      },
    });

    return NextResponse.json({
      message: 'User deleted',
      deleted: {
        id,
        name: `${target.firstName} ${target.lastName}`,
        email: target.email,
      },
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json(
      { message: 'Failed to delete user: ' + err.message },
      { status: 500 }
    );
  }
}