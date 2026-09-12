import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// PATCH approve or reject an application — officers/teachers/admin only
export async function PATCH(req, { params }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!['officer', 'teacher', 'adviser', 'super_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'You do not have permission to review applications' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { decision } = await req.json(); // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Decision must be "approved" or "rejected"' }, { status: 400 });
    }

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    application.status = decision;
    application.reviewedBy = currentUser.id;
    application.reviewedAt = new Date();
    await application.save();

    // If approved, promote the applicant to "member"
    if (decision === 'approved') {
      await User.findByIdAndUpdate(application.applicant, { role: 'member' });
    } else {
      // If rejected, they go back to "user" so they can reapply
      await User.findByIdAndUpdate(application.applicant, { role: 'user' });
    }

    return NextResponse.json(application);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
