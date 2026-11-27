import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicant: {
    name: { type: String },
    email: { type: String },
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  specialization: {
    type: String,
    enum: ['traditional_arts', 'digital_arts', 'animation', 'voice_acting', 'videography', 'photography'],
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
}, { timestamps: true });

// DB-07: Index foreign keys, owner lookups, and specialization queries
portfolioSchema.index({ owner: 1, createdAt: -1 });
portfolioSchema.index({ specialization: 1, status: 1 });
portfolioSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);