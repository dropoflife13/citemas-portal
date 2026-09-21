import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { logActivity } from '@/lib/logActivity';
import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validators';

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid registration payload' }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      accountType,
      studentId,
      staffId,
      yearLevel,
      department,
      specialization,
    } = parsed.data;

    const identityId = accountType === 'student' ? studentId : staffId?.toUpperCase();
    const existing = await User.findOne({
      $or: [
        { email },
        ...(accountType === 'student' ? [{ studentId: identityId }] : [{ staffId: identityId }]),
      ],
    });
    if (existing) {
      return NextResponse.json({ error: 'That email or institutional ID is already registered.' }, { status: 400 });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      accountType,
      studentId: accountType === 'student' ? studentId : undefined,
      staffId: accountType === 'student' ? undefined : identityId,
      yearLevel: accountType === 'student' ? yearLevel : undefined,
      department,
      specialization: accountType === 'student' ? specialization : undefined,
      // Students start as "user" and must apply + be approved to become "member".
      // Staff accounts are verified before they receive teacher/adviser permissions.
      role: accountType === 'student' ? 'user' : 'applicant',
      staffApprovalStatus: accountType === 'student' ? 'not_applicable' : 'pending',
    });
    await newUser.save();

    await logActivity({
      req,
      actor: newUser,
      action: 'user.registered',
      targetType: 'User',
      targetId: newUser._id,
      targetName: `${firstName} ${lastName}`,
      metadata: { email, role: newUser.role, applicationStatus: newUser.applicationStatus },
    });

    const token = generateToken(newUser);
    return NextResponse.json(
      {
        token,
        user: {
          id: newUser._id,
          firstName,
          lastName,
          email,
          role: newUser.role,
          accountType: newUser.accountType,
          staffApprovalStatus: newUser.staffApprovalStatus,
          officerPosition: newUser.officerPosition,
          studentId: newUser.studentId,
          staffId: newUser.staffId,
          yearLevel: newUser.yearLevel,
          department,
          specialization: newUser.specialization,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'That email or institutional ID is already registered.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to create this account.' }, { status: 400 });
  }
}
