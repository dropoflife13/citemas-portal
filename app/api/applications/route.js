import connectDB from '@/lib/mongodb';
import { runInTransaction } from '@/lib/transaction';
import Application from '@/models/Application';
import User from '@/models/User';
import { requireFreshUser } from '@/lib/permissions';
import { NextResponse } from 'next/server';

const REVIEW_ROLES = ['officer', 'teacher', 'adviser', 'super_admin'];

// GET all applications — officers/teachers/admin only
export async function GET(req) {
  const { user: fresh, error, status } = await requireFreshUser(req);
  if (error) {
    return NextResponse.json({ error }, { status });
  }
  if (!REVIEW_ROLES.includes(fresh.role)) {
    return NextResponse.json({ error: 'You do not have permission to view applications' }, { status: 403 });
  }

  await connectDB();
  const applications = await Application.find()
    .populate('applicant', 'firstName lastName email role studentId yearLevel department avatar portfolioImages')
    .populate('reviewedBy', 'firstName lastName role')
    .sort({ createdAt: -1 });
  return NextResponse.json(applications);
}

// POST submit an application — any logged-in "user"
export async function POST(req) {
  const { user: dbUser, decoded: currentUser, error, status } = await requireFreshUser(req);
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    await connectDB();

    if (['member', 'officer', 'super_admin', 'teacher', 'adviser'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'You are already an approved member of CITEMAS' }, { status: 400 });
    }

    const existing = await Application.findOne({ applicant: currentUser.id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending membership application under review' }, { status: 409 });
    }

    const { specialization, motivationLetter, portfolioLink, portfolioImages } = await req.json();

    if (!specialization) {
      return NextResponse.json({ error: 'Specialization is required' }, { status: 400 });
    }
    if (!motivationLetter || motivationLetter.trim().length === 0) {
      return NextResponse.json({ error: 'Motivation letter is required' }, { status: 400 });
    }

    const cleanedImages = Array.isArray(portfolioImages)
      ? portfolioImages
          .filter((url) => typeof url === 'string' && url.trim().length > 0)
          .map((url) => url.trim())
      : [];

    const newApplication = new Application({
      applicant: currentUser.id,
      specialization,
      motivationLetter: motivationLetter.trim(),
      portfolioLink: portfolioLink?.trim() || '',
      portfolioImages: cleanedImages,
    });
    const userUpdate = {
      $set: {
        role: 'applicant',
        applicationStatus: 'pending',
        applicationDate: new Date(),
        specialization,
      },
    };
    if (cleanedImages.length > 0) {
      userUpdate.$addToSet = { portfolioImages: { $each: cleanedImages } };
    }

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};
      await newApplication.save(opts);
      await User.findByIdAndUpdate(currentUser.id, userUpdate, opts);
    });

    return NextResponse.json(newApplication, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
