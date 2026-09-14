import connectDB from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

const STAFF_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];
const CAN_CREATE = ['super_admin', 'teacher', 'adviser', 'officer', 'member', 'alumni'];
const MAX_ENTRIES_PER_MEMBER = 5;

export async function GET(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await connectDB();

  if (STAFF_ROLES.includes(currentUser.role)) {
    const entries = await Portfolio.find()
      .populate('owner', 'firstName lastName email role studentId department yearLevel')
      .sort({ createdAt: -1 });
    return NextResponse.json(entries);
  }

  if (currentUser.role === 'member' || currentUser.role === 'alumni') {
    const entries = await Portfolio.find({ owner: currentUser.id })
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    return NextResponse.json(entries);
  }

  return NextResponse.json({ error: 'You do not have permission to view portfolios' }, { status: 403 });
}

export async function POST(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!CAN_CREATE.includes(currentUser.role)) {
    return NextResponse.json({ error: 'You do not have permission to submit a portfolio' }, { status: 403 });
  }

  try {
    await connectDB();

    if (currentUser.role === 'member') {
      const count = await Portfolio.countDocuments({ owner: currentUser.id });
      if (count >= MAX_ENTRIES_PER_MEMBER) {
        return NextResponse.json(
          { error: `You've reached the limit of ${MAX_ENTRIES_PER_MEMBER} portfolio pieces` },
          { status: 400 }
        );
      }
    }

    const { title, description, specialization, mediaUrl, level, applicantName, applicantEmail } = await req.json();

    // JWT only has id/email/role — fetch full record if we need name for the fallback
    let ownerName = applicantName;
    let ownerEmail = applicantEmail || currentUser.email;
    if (!ownerName) {
      const fullUser = await User.findById(currentUser.id).select('firstName lastName');
      ownerName = fullUser ? `${fullUser.firstName} ${fullUser.lastName}` : '';
    }

    const newEntry = new Portfolio({
      owner: currentUser.id,
      title,
      description,
      specialization,
      mediaUrl,
      level,
      applicant: { name: ownerName, email: ownerEmail },
    });
    await newEntry.save();

    return NextResponse.json(newEntry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!STAFF_ROLES.includes(currentUser.role)) {
    return NextResponse.json({ error: 'Only staff can delete portfolio entries' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Portfolio.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
