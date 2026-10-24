import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/auth';
import { logActivity } from '@/lib/logActivity';
import { NextResponse } from 'next/server';

// =====================================================
// POST — RSVP to an event
// Any authenticated user can RSVP (subject to capacity & schedule)
// =====================================================

export async function POST(req, { params }) {
  const currentUser = getUserFromRequest(req);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

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

    // Business Invariant: Block registration for past or archived events
    const isPastEvent = event.isPast || (event.date && new Date(event.date) < new Date());
    if (isPastEvent) {
      return NextResponse.json(
        { error: 'Cannot register for past or archived events' },
        { status: 400 }
      );
    }

    // Check if already registered
    const alreadyRegistered = (event.attendees || []).some(
      (attendee) => (attendee.user?._id || attendee.user || attendee).toString() === currentUser.id
    );

    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 409 }
      );
    }

    // Atomic Concurrency (DB-05): Conditional findOneAndUpdate guarantees capacity limit cannot be exceeded
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { capacity: null },
          { $expr: { $lt: [{ $size: { $ifNull: ['$attendees', []] } }, '$capacity'] } },
        ],
        'attendees.user': { $ne: currentUser.id },
      },
      {
        $push: {
          attendees: {
            user: currentUser.id,
            registeredAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'This event has reached its maximum capacity' },
        { status: 409 }
      );
    }

    await logActivity({
      req,
      actor: currentUser,
      action: 'event.rsvp_created',
      targetType: 'Event',
      targetId: id,
      targetName: event.title,
      metadata: { attendeeCount: updatedEvent.attendees.length },
    });

    return NextResponse.json(
      {
        message: 'Successfully registered for the event',
        eventId: updatedEvent._id,
        registeredCount: updatedEvent.attendees.length,
        capacity: updatedEvent.capacity,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('POST RSVP error:', err);

    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE — Cancel RSVP
// Any authenticated user can cancel their RSVP
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

    // Atomic Concurrency (DB-05): Pull user atomically
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: id,
        'attendees.user': currentUser.id,
      },
      {
        $pull: {
          attendees: { user: currentUser.id },
        },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 400 }
      );
    }

    await logActivity({
      req,
      actor: currentUser,
      action: 'event.rsvp_cancelled',
      targetType: 'Event',
      targetId: id,
      targetName: event.title,
      metadata: { attendeeCount: updatedEvent.attendees.length },
    });

    return NextResponse.json(
      {
        message: 'RSVP cancelled successfully',
        eventId: updatedEvent._id,
        registeredCount: updatedEvent.attendees.length,
        capacity: updatedEvent.capacity,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('DELETE RSVP error:', err);

    return NextResponse.json(
      { error: 'Failed to cancel RSVP' },
      { status: 500 }
    );
  }
}
