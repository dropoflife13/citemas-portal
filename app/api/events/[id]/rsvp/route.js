import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { getUserFromRequest } from '@/lib/auth';
import { NextResponse } from 'next/server';

// =====================================================
// POST — RSVP to an event
// Any authenticated user can RSVP
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

    // Validate Event ID
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

    // Ensure attendees array exists
    if (!event.attendees) {
      event.attendees = [];
    }

    // Check if user already registered
    const alreadyRegistered = event.attendees.some(
      (attendee) =>
        (attendee.user?._id || attendee.user || attendee).toString() === currentUser.id
    );

    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 409 }
      );
    }

    // Check Event Capacity
    const currentAttendeeCount = event.attendees.length;

    if (
      event.capacity !== null &&
      event.capacity !== undefined &&
      currentAttendeeCount >= event.capacity
    ) {
      return NextResponse.json(
        { error: 'This event has reached its maximum capacity' },
        { status: 409 }
      );
    }

    // Add User to Attendees
    event.attendees.push({
      user: currentUser.id,
      registeredAt: new Date(),
    });

    await event.save();

    return NextResponse.json(
      {
        message: 'Successfully registered for the event',
        eventId: event._id,
        registeredCount: event.attendees.length,
        capacity: event.capacity,
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

    if (!event.attendees) {
      event.attendees = [];
    }

    const isRegistered = event.attendees.some(
      (attendee) =>
        (attendee.user?._id || attendee.user || attendee).toString() === currentUser.id
    );

    if (!isRegistered) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 400 }
      );
    }

    event.attendees = event.attendees.filter(
      (attendee) =>
        (attendee.user?._id || attendee.user || attendee).toString() !== currentUser.id
    );

    await event.save();

    return NextResponse.json(
      {
        message: 'RSVP cancelled successfully',
        eventId: event._id,
        registeredCount: event.attendees.length,
        capacity: event.capacity,
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