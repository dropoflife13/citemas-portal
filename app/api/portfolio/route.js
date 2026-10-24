import connectDB from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { getFreshUser } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logActivity';

const STAFF_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];
const CAN_CREATE = ['super_admin', 'teacher', 'adviser', 'officer', 'member', 'alumni'];
const MAX_ENTRIES_PER_MEMBER = 5;

// GET — Retrieve portfolio pieces
// Staff: All pieces (pending, approved, rejected)
// Members/Alumni: All approved works across the guild + their own submissions
export async function GET(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const fresh = await getFreshUser(currentUser.id);
  if (!fresh) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();

    if (STAFF_ROLES.includes(fresh.role)) {
      const entries = await Portfolio.find()
        .populate('owner', 'firstName lastName email role studentId department yearLevel avatar')
        .sort({ createdAt: -1 });
      return NextResponse.json(entries);
    }

    if (fresh.role === 'member' || fresh.role === 'alumni') {
      const entries = await Portfolio.find({
        $or: [
          { status: 'approved' },
          { owner: currentUser.id },
        ],
      })
        .populate('owner', 'firstName lastName email role studentId department yearLevel avatar')
        .sort({ createdAt: -1 });
      return NextResponse.json(entries);
    }

    return NextResponse.json({ error: 'You do not have permission to view portfolios' }, { status: 403 });
  } catch (err) {
    console.error('GET portfolio error:', err);
    return NextResponse.json({ error: 'Failed to load portfolios' }, { status: 500 });
  }
}

// POST — Create a new portfolio entry
export async function POST(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const fresh = await getFreshUser(currentUser.id);
  if (!fresh) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!CAN_CREATE.includes(fresh.role)) {
    return NextResponse.json({ error: 'You do not have permission to submit a portfolio' }, { status: 403 });
  }

  try {
    await connectDB();

    if (fresh.role === 'member') {
      const count = await Portfolio.countDocuments({ owner: currentUser.id });
      if (count >= MAX_ENTRIES_PER_MEMBER) {
        return NextResponse.json(
          { error: `You've reached the limit of ${MAX_ENTRIES_PER_MEMBER} portfolio pieces` },
          { status: 400 }
        );
      }
    }

    const { title, description, specialization, mediaUrl, level, applicantName, applicantEmail } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!mediaUrl || !mediaUrl.trim()) {
      return NextResponse.json({ error: 'Media URL or upload is required' }, { status: 400 });
    }

    // Staff/officer creations are automatically approved; member submissions default to approved unless moderated
    const initialStatus = STAFF_ROLES.includes(fresh.role) ? 'approved' : 'approved';

    let ownerName = applicantName;
    let ownerEmail = applicantEmail || currentUser.email;
    if (!ownerName) {
      const fullUser = await User.findById(currentUser.id).select('firstName lastName');
      ownerName = fullUser ? `${fullUser.firstName} ${fullUser.lastName}` : '';
    }

    const newEntry = new Portfolio({
      owner: currentUser.id,
      title: title.trim(),
      description: description.trim(),
      specialization,
      mediaUrl: mediaUrl.trim(),
      level: level || 'beginner',
      status: initialStatus,
      applicant: { name: ownerName, email: ownerEmail },
    });
    await newEntry.save();

    // Increment user portfolio count
    const totalCount = await Portfolio.countDocuments({ owner: currentUser.id });
    await User.findByIdAndUpdate(currentUser.id, { portfolioCount: totalCount });

    await logActivity({
      req,
      actor: currentUser,
      action: 'portfolio.created',
      targetType: 'Portfolio',
      targetId: newEntry._id,
      targetName: newEntry.title,
      metadata: { specialization, level, mediaUrl },
    });

    const populatedEntry = await Portfolio.findById(newEntry._id)
      .populate('owner', 'firstName lastName email role studentId department yearLevel avatar');

    return NextResponse.json(populatedEntry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PATCH — Moderate portfolio piece (Approve / Reject / Feedback)
export async function PATCH(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const fresh = await getFreshUser(currentUser.id);
  if (!fresh || !STAFF_ROLES.includes(fresh.role)) {
    return NextResponse.json({ error: 'Only staff can moderate portfolio submissions' }, { status: 403 });
  }

  try {
    const { id, status, feedback } = await req.json();
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Valid id and status ("approved", "rejected", "pending") required' }, { status: 400 });
    }

    await connectDB();
    const updated = await Portfolio.findByIdAndUpdate(
      id,
      { status, feedback: typeof feedback === 'string' ? feedback.trim() : undefined },
      { new: true }
    ).populate('owner', 'firstName lastName email role studentId department yearLevel avatar');

    if (!updated) {
      return NextResponse.json({ error: 'Portfolio entry not found' }, { status: 404 });
    }

    await logActivity({
      req,
      actor: currentUser,
      action: `portfolio.${status}`,
      targetType: 'Portfolio',
      targetId: id,
      targetName: updated.title,
      metadata: { newStatus: status, feedback },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Remove a portfolio piece (Staff OR original owner)
export async function DELETE(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const fresh = await getFreshUser(currentUser.id);
  if (!fresh) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    await connectDB();
    const entry = await Portfolio.findById(id);
    if (!entry) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const isStaff = STAFF_ROLES.includes(fresh.role);
    const isOwner = String(entry.owner) === String(currentUser.id);

    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: 'You do not have permission to delete this portfolio piece' }, { status: 403 });
    }

    await Portfolio.findByIdAndDelete(id);

    // Update remaining portfolio count on owner
    if (entry.owner) {
      const remainingCount = await Portfolio.countDocuments({ owner: entry.owner });
      await User.findByIdAndUpdate(entry.owner, { portfolioCount: remainingCount });
    }

    await logActivity({
      req,
      actor: currentUser,
      action: 'portfolio.deleted',
      targetType: 'Portfolio',
      targetId: id,
      targetName: entry.title,
      metadata: { owner: entry.owner, specialization: entry.specialization },
    });

    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
