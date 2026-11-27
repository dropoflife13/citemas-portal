import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { getFreshUser } from '@/lib/permissions';
import { logActivity } from '@/lib/logActivity';

const STAFF_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid achievement ID' }, { status: 400 });
    }

    await connectDB();

    const achievement = await Achievement.findById(id)
      .populate('user', 'firstName lastName email avatar role officerPosition')
      .lean();

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const currentUser = getUserFromRequest(req);
    const fresh = currentUser ? await getFreshUser(currentUser.id) : null;
    const isOwner = fresh && String(achievement.user?._id || achievement.user) === String(fresh._id);
    const isStaff = fresh && STAFF_ROLES.includes(fresh.role);

    if (achievement.visibility === 'private' && !isOwner && !isStaff) {
      return NextResponse.json({ error: 'You do not have permission to view this achievement' }, { status: 403 });
    }

    return NextResponse.json({ achievement });
  } catch (err) {
    console.error('GET single achievement error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch achievement' },
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
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid achievement ID' }, { status: 400 });
    }

    const fresh = await getFreshUser(currentUser.id);
    if (!fresh) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const isOwner = String(achievement.user) === String(fresh._id);
    const isStaff = STAFF_ROLES.includes(fresh.role);

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this achievement' },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (body.credentialUrl !== undefined) {
      const trimmed = typeof body.credentialUrl === 'string' ? body.credentialUrl.trim() : '';
      if (trimmed && !/^https:\/\//i.test(trimmed)) {
        return NextResponse.json({ error: 'Credential URL must use https://' }, { status: 400 });
      }
      body.credentialUrl = trimmed;
    }

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
      { error: 'Failed to update achievement' },
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
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid achievement ID' }, { status: 400 });
    }

    const fresh = await getFreshUser(currentUser.id);
    if (!fresh) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const achievement = await Achievement.findById(id);
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const isOwner = String(achievement.user) === String(fresh._id);
    const isStaff = fresh.role === 'super_admin' || ['teacher', 'adviser'].includes(fresh.role);

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
      { error: 'Failed to delete achievement' },
      { status: 500 }
    );
  }
}
