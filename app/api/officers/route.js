// app/api/officers/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { POSITION_ORDER as positionOrder, formatPosition } from '@/lib/permissions';

export async function GET() {
  try {
    await connectDB();

    const officers = await User.find({
      role: 'officer',
      officerPosition: { $ne: null },
    })
      .select('firstName lastName officerPosition avatar department yearLevel bio')
      .sort({ createdAt: 1 });

    const mapped = officers
      .map((member) => ({
        _id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        officerPosition: member.officerPosition,
        displayPosition: formatPosition(member.officerPosition),
        avatar: member.avatar || null,
        department: member.department || 'PHINMA University of Iloilo',
        yearLevel: member.yearLevel || null,
        bio: member.bio || '',
      }))
      .sort((a, b) => {
        const orderA = positionOrder[a.officerPosition] ?? 99;
        const orderB = positionOrder[b.officerPosition] ?? 99;
        return orderA - orderB;
      });

    return NextResponse.json({ officers: mapped });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch officers: ' + error.message },
      { status: 500 }
    );
  }
}