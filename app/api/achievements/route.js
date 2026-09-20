import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Achievement from '@/models/Achievement';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logActivity';

const ALLOWED_CREATORS = ['super_admin', 'teacher', 'adviser', 'officer', 'member', 'alumni'];
const STAFF_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];

export async function GET(req) {
  try {
    await connectDB();

    const currentUser = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get('userId');
    const limitParam = parseInt(searchParams.get('limit') || '0', 10);
    const recent = searchParams.get('recent') === 'true';

    const isStaff = currentUser && STAFF_ROLES.includes(currentUser.role);
    const filter = {};

    if (userId) {
      filter.user = userId;
      // If querying specific user and not owner/staff, only show public
      if (!currentUser || (currentUser.id !== userId && !isStaff)) {
        filter.visibility = 'public';
      }
    } else {
      // General list / Dashboard
      if (isStaff) {
        // staff can see all
      } else if (currentUser) {
        // authenticated member sees public + own
        filter.$or = [{ visibility: 'public' }, { user: currentUser.id }];
      } else {
        // unauthenticated sees public only
        filter.visibility = 'public';
      }
    }

    const sortOption = recent ? { createdAt: -1 } : { displayOrder: 1, createdAt: -1 };

    let query = Achievement.find(filter)
      .sort(sortOption)
      .populate('user', 'firstName lastName email avatar role officerPosition specialization');

    if (limitParam > 0) {
      query = query.limit(limitParam);
    }

    const achievements = await query.lean();

    return NextResponse.json({ achievements });
  } catch (err) {
    console.error('GET achievements error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch achievements: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!ALLOWED_CREATORS.includes(currentUser.role)) {
    return NextResponse.json(
      { error: 'You do not have permission to post achievements' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await req.json();
    const {
      title,
      description,
      date,
      category = 'Award',
      issuer = 'CITEMAS',
      credentialUrl = '',
      image = '',
      visibility = 'public',
      portfolio = null,
      displayOrder = 0,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Achievement title is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Achievement description is required' }, { status: 400 });
    }
    if (!date || typeof date !== 'string' || !date.trim()) {
      return NextResponse.json({ error: 'Achievement date or year is required' }, { status: 400 });
    }

    const validCategories = ['Award', 'Certificate', 'Recognition', 'Competition', 'Project', 'Other'];
    const safeCategory = validCategories.includes(category) ? category : 'Award';
    const safeVisibility = ['public', 'private'].includes(visibility) ? visibility : 'public';

    const achievement = new Achievement({
      user: currentUser.id,
      portfolio: portfolio || null,
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      category: safeCategory,
      issuer: issuer ? issuer.trim() : 'CITEMAS',
      credentialUrl: credentialUrl ? credentialUrl.trim() : '',
      image: image || '',
      visibility: safeVisibility,
      displayOrder: Number(displayOrder) || 0,
    });

    await achievement.save();

    await logActivity({
      req,
      actor: currentUser,
      action: 'achievement.created',
      targetType: 'Achievement',
      targetId: achievement._id,
      targetName: achievement.title,
      metadata: { category: safeCategory, visibility: safeVisibility },
    });

    const populated = await Achievement.findById(achievement._id)
      .populate('user', 'firstName lastName email avatar role officerPosition specialization')
      .lean();

    return NextResponse.json({ achievement: populated, message: 'Achievement posted successfully' }, { status: 201 });
  } catch (err) {
    console.error('POST achievement error:', err);
    return NextResponse.json(
      { error: 'Failed to create achievement: ' + err.message },
      { status: 400 }
    );
  }
}
