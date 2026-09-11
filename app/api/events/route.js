import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import User from '@/models/User';
const CAN_MANAGE = ['officer', 'teacher', 'super_admin'];

// GET — get all events
// Any authenticated user can view events
export async function GET(req) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const events = await Event.find()
      .sort({ date: 1 })
      .populate('createdBy', 'firstName lastName');

    const formattedEvents = events.map((event) => ({
      ...event.toObject(),
      attendeeCount: event.attendees?.length || 0,
    }));

    return NextResponse.json(formattedEvents, {
      status: 200,
    });

  } catch (err) {
    console.error('GET events error:', err);

    return NextResponse.json(
      { error: 'Failed to load events' },
      { status: 500 }
    );
  }
}


// POST — create an event
// Only officer, teacher, and super_admin
export async function POST(req) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  if (!CAN_MANAGE.includes(currentUser.role)) {
    return NextResponse.json(
      {
        error:
          'You do not have permission to create events',
      },
      { status: 403 }
    );
  }

  try {
    let body;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      date,
      location,
      capacity,
    } = body;


    // -------------------------
    // TITLE VALIDATION
    // -------------------------

    if (
      typeof title !== 'string' ||
      title.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      );
    }

    if (title.trim().length > 150) {
      return NextResponse.json(
        {
          error:
            'Event title cannot exceed 150 characters',
        },
        { status: 400 }
      );
    }


    // -------------------------
    // DESCRIPTION VALIDATION
    // -------------------------

    if (
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Event description is required' },
        { status: 400 }
      );
    }

    if (description.trim().length > 2000) {
      return NextResponse.json(
        {
          error:
            'Event description cannot exceed 2000 characters',
        },
        { status: 400 }
      );
    }


    // -------------------------
    // LOCATION VALIDATION
    // -------------------------

    if (
      typeof location !== 'string' ||
      location.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Event location is required' },
        { status: 400 }
      );
    }

    if (location.trim().length > 200) {
      return NextResponse.json(
        {
          error:
            'Event location cannot exceed 200 characters',
        },
        { status: 400 }
      );
    }


    // -------------------------
    // DATE VALIDATION
    // -------------------------

    if (!date) {
      return NextResponse.json(
        { error: 'Event date is required' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid event date' },
        { status: 400 }
      );
    }


    // -------------------------
    // CAPACITY VALIDATION
    // -------------------------

    let parsedCapacity = null;

    // Empty/null capacity = unlimited
    if (
      capacity !== undefined &&
      capacity !== null &&
      capacity !== ''
    ) {
      const numericCapacity = Number(capacity);

      if (
        !Number.isInteger(numericCapacity) ||
        numericCapacity < 1
      ) {
        return NextResponse.json(
          {
            error:
              'Capacity must be a whole number greater than 0',
          },
          { status: 400 }
        );
      }

      parsedCapacity = numericCapacity;
    }


    // -------------------------
    // CREATE EVENT
    // -------------------------

    await connectDB();

    const newEvent = new Event({
      title: title.trim(),
      description: description.trim(),
      date: parsedDate,
      location: location.trim(),
      capacity: parsedCapacity,
      createdBy: currentUser.id,
      attendees: [],
    });

    await newEvent.save();


    // Populate creator before returning
    const createdEvent = await Event.findById(newEvent._id)
      .populate('createdBy', 'firstName lastName');

    return NextResponse.json(
      {
        ...createdEvent.toObject(),
        attendeeCount: 0,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('POST event error:', err);

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}