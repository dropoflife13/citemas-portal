import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Event title cannot exceed 150 characters'],
    },

    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Event description cannot exceed 2000 characters'],
    },

    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },

    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
      maxlength: [200, 'Event location cannot exceed 200 characters'],
    },

    // null = unlimited capacity
    capacity: {
      type: Number,
      default: null,
      min: [1, 'Capacity must be at least 1'],
      validate: {
        validator: function (value) {
          return value === null || Number.isInteger(value);
        },
        message: 'Capacity must be a whole number or null',
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event creator is required'],
    },

    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },

        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Event ||
  mongoose.model('Event', eventSchema);