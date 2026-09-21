// app/api/officers/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { POSITION_ORDER as positionOrder, formatPosition } from '@/lib/permissions';

export async function GET() {
  try {
    await connectDB();

    // Query active officers with non-null position
    const officers = await User.find({
      role: 'officer',
      officerPosition: { $ne: null },
    })
      .select('firstName lastName officerPosition avatar department yearLevel bio')
      .sort({ createdAt: 1 })
      .lean();

    // Transform into clean public DTO
    const mapped = officers
      .map((member) => ({
        _id: String(member._id),
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        officerPosition: member.officerPosition,
        displayPosition: formatPosition(member.officerPosition),
        avatar: typeof member.avatar === 'string' && member.avatar.startsWith('http') ? member.avatar : null,
        department: member.department || 'PHINMA University of Iloilo',
        yearLevel: member.yearLevel || null,
        bio: member.bio || '',
      }))
      .sort((a, b) => {
        const orderA = positionOrder[a.officerPosition] ?? 99;
        const orderB = positionOrder[b.officerPosition] ?? 99;
        return orderA - orderB;
      });

    return NextResponse.json(
      { officers: mapped },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch officers roster', message: error.message },
      { status: 500 }
    );
  }
}