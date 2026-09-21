import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const CAN_MANAGE = ['officer', 'teacher', 'adviser', 'super_admin'];

// =====================================================
// GET — Get a single event
// Any authenticated user can view
// =====================================================

export async function GET(req, { params }) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.user', 'firstName lastName email');

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ...event.toObject(),
        attendeeCount: event.attendees?.length || 0,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('GET single event error:', err);

    return NextResponse.json(
      { error: 'Failed to load event' },
      { status: 500 }
    );
  }
}


// =====================================================
// PATCH — Update an event
// Creator OR officer/teacher/super_admin
// =====================================================

export async function PATCH(req, { params }) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // Permission check
    // -------------------------------------------------

    const isCreator =
      event.createdBy.toString() === currentUser.id;

    const canManage =
      CAN_MANAGE.includes(currentUser.role);

    if (!isCreator && !canManage) {
      return NextResponse.json(
        {
          error:
            'You do not have permission to edit this event',
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------
    // Read request body
    // -------------------------------------------------

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
      image,
      images,
      highlights,
      isPast,
    } = body;


    // -------------------------------------------------
    // TITLE
    // -------------------------------------------------

    if (title !== undefined) {
      if (
        typeof title !== 'string' ||
        title.trim().length === 0
      ) {
        return NextResponse.json(
          { error: 'Event title cannot be empty' },
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

      event.title = title.trim();
    }


    // -------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------

    if (description !== undefined) {
      if (
        typeof description !== 'string' ||
        description.trim().length === 0
      ) {
        return NextResponse.json(
          {
            error:
              'Event description cannot be empty',
          },
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

      event.description = description.trim();
    }


    // -------------------------------------------------
    // LOCATION
    // -------------------------------------------------

    if (location !== undefined) {
      if (
        typeof location !== 'string' ||
        location.trim().length === 0
      ) {
        return NextResponse.json(
          { error: 'Event location cannot be empty' },
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

      event.location = location.trim();
    }


    // -------------------------------------------------
    // DATE
    // -------------------------------------------------

    if (date !== undefined) {
      if (!date) {
        return NextResponse.json(
          { error: 'Event date cannot be empty' },
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

      event.date = parsedDate;
    }


    // -------------------------------------------------
    // CAPACITY
    // -------------------------------------------------

    if (capacity !== undefined) {
      // null or empty string = unlimited
      if (capacity === null || capacity === '') {
        event.capacity = null;
      } else {
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

        const currentAttendees =
          event.attendees?.length || 0;

        if (numericCapacity < currentAttendees) {
          return NextResponse.json(
            {
              error:
                `Capacity cannot be lower than the current attendee count (${currentAttendees})`,
            },
            { status: 400 }
          );
        }

        event.capacity = numericCapacity;
      }
    }


    // -------------------------------------------------
    // NEW FIELDS (image, images, highlights, isPast)
    // -------------------------------------------------

    if (image !== undefined) {
      event.image = typeof image === 'string' ? image.trim() : null;
    }

    if (images !== undefined) {
      event.images = Array.isArray(images)
        ? images.filter((u) => typeof u === 'string' && u.trim())
        : [];
    }

    if (highlights !== undefined) {
      event.highlights = typeof highlights === 'string' ? highlights.slice(0, 3000) : '';
    }

    if (isPast !== undefined) {
      event.isPast = Boolean(isPast);
    }


    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    await event.save();


    // -------------------------------------------------
    // Return updated event
    // -------------------------------------------------

    const updatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.user', 'firstName lastName email');

    return NextResponse.json(
      {
        ...updatedEvent.toObject(),
        attendeeCount:
          updatedEvent.attendees?.length || 0,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('PATCH event error:', err);

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}


// =====================================================
// DELETE — Delete an event
// Creator OR officer/teacher/super_admin
// =====================================================

export async function DELETE(req, { params }) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // -------------------------------------------------
    // Permission check
    // -------------------------------------------------

    const isCreator =
      event.createdBy.toString() === currentUser.id;

    const canManage =
      CAN_MANAGE.includes(currentUser.role);

    if (!isCreator && !canManage) {
      return NextResponse.json(
        {
          error:
            'You do not have permission to delete this event',
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------
    // Delete event
    // -------------------------------------------------

    await Event.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: 'Event deleted successfully',
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('DELETE event error:', err);

    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
