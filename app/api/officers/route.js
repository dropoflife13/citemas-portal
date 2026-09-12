import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const positionOrder = {
  president: 1,
  vice_president: 2,
  secretary: 3,
  treasurer: 4,
  pro: 5,
  events_director: 6,
  creative_director: 7,
  year_level_representative: 8,
};

const formatPosition = (role) => {
  if (!role) return 'Officer';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export async function GET() {
  try {
    await connectDB();

    const officers = await User.find({
      role: 'officer',
      officerPosition: { $ne: null },
    })
      .select('firstName lastName email officerPosition avatar department yearLevel bio')
      .sort({ createdAt: 1 });

    const mapped = officers
      .map((member) => ({
        _id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
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
