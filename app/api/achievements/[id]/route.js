import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logActivity';

const STAFF_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const achievement = await Achievement.findById(id)
      .populate('user', 'firstName lastName email avatar role officerPosition')
      .lean();

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const currentUser = getUserFromRequest(req);
    const isOwner = currentUser && String(achievement.user?._id || achievement.user) === String(currentUser.id);
    const isStaff = currentUser && STAFF_ROLES.includes(currentUser.role);

    if (achievement.visibility === 'private' && !isOwner && !isStaff) {
      return NextResponse.json({ error: 'You do not have permission to view this achievement' }, { status: 403 });
    }

    return NextResponse.json({ achievement });
  } catch (err) {
    console.error('GET single achievement error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch achievement: ' + err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const isOwner = String(achievement.user) === String(currentUser.id);
    const isStaff = STAFF_ROLES.includes(currentUser.role);

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this achievement' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const allowedFields = ['title', 'description', 'date', 'category', 'issuer', 'credentialUrl', 'image', 'visibility', 'displayOrder'];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        achievement[field] = body[field];
      }
    });

    await achievement.save();

    await logActivity({
      req,
      actor: currentUser,
      action: 'achievement.updated',
      targetType: 'Achievement',
      targetId: achievement._id,
      targetName: achievement.title,
      metadata: { updatedBy: currentUser.id },
    });

    const populated = await Achievement.findById(achievement._id)
      .populate('user', 'firstName lastName email avatar role officerPosition')
      .lean();

    return NextResponse.json({ achievement: populated, message: 'Achievement updated successfully' });
  } catch (err) {
    console.error('PATCH achievement error:', err);
    return NextResponse.json(
      { error: 'Failed to update achievement: ' + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const isOwner = String(achievement.user) === String(currentUser.id);
    const isStaff = currentUser.role === 'super_admin' || ['teacher', 'adviser'].includes(currentUser.role);

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this achievement' },
        { status: 403 }
      );
    }

    await Achievement.findByIdAndDelete(id);

    await logActivity({
      req,
      actor: currentUser,
      action: 'achievement.deleted',
      targetType: 'Achievement',
      targetId: id,
      targetName: achievement.title,
      metadata: { ownerId: achievement.user },
    });

    return NextResponse.json({ message: 'Achievement deleted successfully', id });
  } catch (err) {
    console.error('DELETE achievement error:', err);
    return NextResponse.json(
      { error: 'Failed to delete achievement: ' + err.message },
      { status: 500 }
    );
  }
}
