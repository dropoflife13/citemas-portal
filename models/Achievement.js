import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Achievement owner is required'],
      index: true,
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    date: {
      type: String,
      required: [true, 'Achievement date or year is required'],
      trim: true,
      maxlength: [50, 'Date cannot exceed 50 characters'],
    },
    category: {
      type: String,
      enum: ['Award', 'Certificate', 'Recognition', 'Competition', 'Project', 'Other'],
      default: 'Award',
    },
    issuer: {
      type: String,
      default: 'CITEMAS',
      trim: true,
      maxlength: [100, 'Issuer cannot exceed 100 characters'],
    },
    credentialUrl: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
  },
  { timestamps: true }
);

achievementSchema.index({ visibility: 1, createdAt: -1 });
achievementSchema.index({ user: 1, visibility: 1, displayOrder: 1 });

export default mongoose.models.Achievement ||
  mongoose.model('Achievement', achievementSchema);
