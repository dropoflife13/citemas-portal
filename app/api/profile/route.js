import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { profilePatchSchema } from '@/lib/validators';

const VALID_DEPARTMENTS = [
  'College of Arts & Sciences (CAS)',
  'College of Accountancy',
  'College of Allied Health Sciences (CAHS)',
  'College of Criminal Justice Education (CCJE)',
  'College of Education (CoEd)',
  'College of Engineering',
  'College of Information Technology Education (CITE)',
  'College of Management (COM)',
  'College of Maritime Education (COME)',
  'BS Information Technology',
  'BS Computer Science',
  'BS Business Administration',
  'BS Accountancy',
  'BS Hospitality Management',
  'BS Tourism Management',
  'Bachelor of Elementary Education',
  'Bachelor of Secondary Education',
  'Bachelor of Science in Nursing',
];

export async function GET(req) {
  try {
    const authResult = await verifyAuth(req);
    
    if (!authResult || !authResult.success) {
      return NextResponse.json(
        { message: authResult?.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = authResult.user.id || authResult.user._id;
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('CRITICAL /api/profile GET Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal Server Error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const authResult = await verifyAuth(req);

    if (!authResult || !authResult.success) {
      return NextResponse.json(
        { message: authResult?.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const parsed = profilePatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Invalid profile payload' }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      phone,
      bio,
      yearLevel,
      department,
      specialization,
    } = parsed.data;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (yearLevel !== undefined) updates.yearLevel = yearLevel.trim();
    if (department !== undefined) updates.department = department.trim();
    if (specialization !== undefined) updates.specialization = specialization.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid profile fields were provided' }, { status: 400 });
    }

    const userId = authResult.user.id || authResult.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password').lean();

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Profile updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('CRITICAL /api/profile PATCH Error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to update profile', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  return PATCH(req);
}
