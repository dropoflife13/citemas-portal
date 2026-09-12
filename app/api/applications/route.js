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

    const existing = await Application.findOne({ applicant: currentUser.id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending application' }, { status: 400 });
    }

    const { specialization, motivationLetter, portfolioLink } = await req.json();

    const newApplication = new Application({
      applicant: currentUser.id,
      specialization,
      motivationLetter,
      portfolioLink,
    });
    await newApplication.save();

    // Move the user's role from "user" to "applicant"
    await User.findByIdAndUpdate(currentUser.id, { role: 'applicant' });

    return NextResponse.json(newApplication, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
