import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

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
    const { phone, bio } = body;

    const updates = {};
    if (phone !== undefined) updates.phone = phone.trim();
    if (bio !== undefined) updates.bio = bio.trim();

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