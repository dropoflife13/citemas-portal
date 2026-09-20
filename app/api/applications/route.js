import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET all applications — officers/teachers/admin only
export async function GET(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!['officer', 'teacher', 'adviser', 'super_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'You do not have permission to view applications' }, { status: 403 });
  }

  await connectDB();
  const applications = await Application.find()
    .populate('applicant', 'firstName lastName email role')
    .sort({ createdAt: -1 });
  return NextResponse.json(applications);
}

// POST submit an application — any logged-in "user"
export async function POST(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();

    const dbUser = await User.findById(currentUser.id).select('role');
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (['member', 'officer', 'super_admin', 'teacher', 'adviser'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'You are already an approved member of CITEMAS' }, { status: 400 });
    }

    const existing = await Application.findOne({ applicant: currentUser.id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending membership application under review' }, { status: 409 });
    }

    const { specialization, motivationLetter, portfolioLink } = await req.json();

    if (!specialization) {
      return NextResponse.json({ error: 'Specialization is required' }, { status: 400 });
    }
    if (!motivationLetter || motivationLetter.trim().length === 0) {
      return NextResponse.json({ error: 'Motivation letter is required' }, { status: 400 });
    }

    const newApplication = new Application({
      applicant: currentUser.id,
      specialization,
      motivationLetter: motivationLetter.trim(),
      portfolioLink: portfolioLink?.trim() || '',
    });
    await newApplication.save();

    await User.findByIdAndUpdate(currentUser.id, {
      role: 'applicant',
      applicationStatus: 'pending',
      applicationDate: new Date(),
    });

    return NextResponse.json(newApplication, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
