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

    const application = await Application.findById(id).populate('applicant', 'firstName lastName email role applicationStatus');
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const applicant = application.applicant || {};
    const applicantId = applicant._id || application.applicant;
    const applicantName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Unknown';
    const previousRole = applicant.role || 'user';
    const previousApplicationStatus = applicant.applicationStatus || 'pending';

    // Step b: Update Application document status
    application.status = decision;
    application.reviewedBy = currentUser.id;
    application.reviewedAt = new Date();
    await application.save();

    // Step c: Update User document (role + applicationStatus)
    const newRole = decision === 'approved' ? 'member' : (previousRole === 'applicant' ? 'user' : previousRole);
    const newApplicationStatus = decision === 'approved' ? 'approved' : 'rejected';

    if (applicantId) {
      await User.findByIdAndUpdate(applicantId, {
        role: newRole,
        applicationStatus: newApplicationStatus,
      });
    }

    // Step d: Call logActivity AFTER User record is updated successfully
    await logActivity({
      req,
      actor: currentUser,
      action: decision === 'approved' ? 'application.approved' : 'application.rejected',
      targetType: 'Application',
      targetId: id,
      targetName: applicantName,
      metadata: {
        applicantId,
        applicantName,
        previousRole,
        newRole,
        previousApplicationStatus,
        newApplicationStatus,
      },
    });

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