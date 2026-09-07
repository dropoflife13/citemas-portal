import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectDB();
    const { firstName, lastName, email, password } = await req.json();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const newUser = new User({ firstName, lastName, email, password });
    await newUser.save();

    const token = generateToken(newUser);
    return NextResponse.json({
      token,
      newUser: { id: newUser._id, firstName, lastName, email, role: newUser.role }
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}