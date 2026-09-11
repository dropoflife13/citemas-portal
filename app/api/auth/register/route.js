import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

const VALID_YEAR_LEVELS = ['1st', '2nd', '3rd', '4th', 'Graduate'];
const VALID_SPECIALIZATIONS = ['traditional_arts', 'digital_arts', 'voice_acting', 'video_editing', 'photography'];
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
];

export async function POST(req) {
  try {
    await connectDB();
    const {
      firstName,
      lastName,
      email,
      password,
      studentId,
      yearLevel,
      department,
      specialization,
    } = await req.json();

    // Required field checks
    const missing = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!studentId) missing.push('studentId');
    if (!yearLevel) missing.push('yearLevel');
    if (!department) missing.push('department');
    if (!specialization) missing.push('specialization');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required field(s): ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_YEAR_LEVELS.includes(yearLevel)) {
      return NextResponse.json({ error: 'Invalid year level' }, { status: 400 });
    }

    if (!VALID_DEPARTMENTS.includes(department)) {
      return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
    }

    if (!VALID_SPECIALIZATIONS.includes(specialization)) {
      return NextResponse.json({ error: 'Invalid specialization' }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      studentId,
      yearLevel,
      department,
      specialization,
    });
    await newUser.save();

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
          officerPosition: newUser.officerPosition,
          studentId,
          yearLevel,
          department,
          specialization,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}