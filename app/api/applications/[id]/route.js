import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logActivity';

const REVIEW_ROLES = ['officer', 'teacher', 'adviser', 'super_admin'];

// PATCH approve or reject an application — officers/teachers/admin only
export async function PATCH(req, { params }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!REVIEW_ROLES.includes(currentUser.role)) {
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
      // If rejected, restore members to "member" (their base role).
      // Only legacy "user"/"applicant" accounts go back to "user" so they can reapply.
      const applicant = await User.findById(application.applicant).select('role');
      if (applicant && applicant.role === 'applicant') {
        await User.findByIdAndUpdate(application.applicant, { role: 'user' });
      }
    }

    return NextResponse.json(application);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE remove an application — officers/teachers/admin only
export async function DELETE(req, { params }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!REVIEW_ROLES.includes(currentUser.role)) {
    return NextResponse.json({ error: 'You do not have permission to delete applications' }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const application = await Application.findById(id).populate('applicant', 'firstName lastName email role');
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const applicant = application.applicant || {};
    const applicantName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Unknown';

    await Application.findByIdAndDelete(id);

    await logActivity({
      req,
      actor: currentUser,
      action: 'application.deleted',
      targetType: 'Application',
      targetId: id,
      targetName: applicantName,
      metadata: { applicantEmail: applicant.email },
    });

    return NextResponse.json({ message: 'Application deleted', deleted: { id, applicantName } });
  } catch (err) {
    console.error('Delete application error:', err);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}