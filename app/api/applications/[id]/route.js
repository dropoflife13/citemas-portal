import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { runInTransaction } from '@/lib/transaction';
import Application from '@/models/Application';
import User from '@/models/User';
import { requireFreshUser } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logActivity';

const REVIEW_ROLES = ['officer', 'teacher', 'adviser', 'super_admin'];

// PATCH approve or reject an application — officers/teachers/admin only
export async function PATCH(req, { params }) {
  const { user: fresh, decoded: currentUser, error, status } = await requireFreshUser(req);
  if (error) {
    return NextResponse.json({ error }, { status });
  }
  if (!REVIEW_ROLES.includes(fresh.role)) {
    return NextResponse.json({ error: 'You do not have permission to review applications' }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    await connectDB();
    const { decision } = await req.json(); // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Decision must be "approved" or "rejected"' }, { status: 400 });
    }

    const application = await Application.findById(id).populate('applicant', 'firstName lastName email role applicationStatus');
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: `Application has already been ${application.status}` },
        { status: 409 }
      );
    }

    const applicant = application.applicant || {};
    const applicantId = applicant._id || application.applicant;
    const applicantName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Unknown';
    const previousRole = applicant.role || 'user';
    const previousApplicationStatus = applicant.applicationStatus || 'pending';

    // Invariant Enforcement (SEC-05): Approver cannot be the submitter
    if (String(applicantId) === String(currentUser.id)) {
      return NextResponse.json(
        { error: 'Self-approval is prohibited. Applications must be reviewed by another officer or adviser.' },
        { status: 403 }
      );
    }

    // Step b & c: Atomically update Application and User documents
    application.status = decision;
    application.reviewedBy = currentUser.id;
    application.reviewedAt = new Date();

    const newRole = decision === 'approved' ? 'member' : (previousRole === 'applicant' ? 'user' : previousRole);
    const newApplicationStatus = decision === 'approved' ? 'approved' : 'rejected';

    await runInTransaction(async (session) => {
      const opts = session ? { session } : {};
      await application.save(opts);

      if (applicantId) {
        const updateDoc = {
          $set: {
            role: newRole,
            applicationStatus: newApplicationStatus,
          },
        };
        if (decision === 'approved' && Array.isArray(application.portfolioImages) && application.portfolioImages.length > 0) {
          updateDoc.$addToSet = { portfolioImages: { $each: application.portfolioImages } };
        }
        await User.findByIdAndUpdate(applicantId, updateDoc, opts);
      }
    });

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

    await application.populate([
      { path: 'applicant', select: 'firstName lastName email role studentId yearLevel department avatar' },
      { path: 'reviewedBy', select: 'firstName lastName role' },
    ]);
    return NextResponse.json(application);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE remove an application — officers/teachers/admin only
export async function DELETE(req, { params }) {
  const { user: fresh, decoded: currentUser, error, status } = await requireFreshUser(req);
  if (error) {
    return NextResponse.json({ error }, { status });
  }
  if (!REVIEW_ROLES.includes(fresh.role)) {
    return NextResponse.json({ error: 'You do not have permission to delete applications' }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    await connectDB();

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