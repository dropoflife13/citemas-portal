import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET all events — anyone logged in can view
export async function GET(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await connectDB();
  const events = await Event.find().sort({ date: 1 });
  return NextResponse.json(events);
}

// POST create event — only officer, teacher, super_admin
export async function POST(req) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!['officer', 'teacher', 'super_admin'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'You do not have permission to create events' }, { status: 403 });
  }

  try {
    await connectDB();
    const { title, description, date, location } = await req.json();

    const newEvent = new Event({
      title, description, date, location,
      createdBy: currentUser.id,
    });
    await newEvent.save();

    return NextResponse.json(newEvent, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}