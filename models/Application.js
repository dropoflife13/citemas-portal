import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  specialization: {
    type: String,
    enum: ['traditional_arts', 'digital_arts', 'animation', 'voice_acting', 'videography', 'photography'],
    required: true,
  },
  motivationLetter: { type: String, required: true },
  portfolioLink: { type: String },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

// DB-05 & DB-07: Compound index and partial unique index to prevent duplicate pending applications
applicationSchema.index({ applicant: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index(
  { applicant: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export default mongoose.models.Application || mongoose.model('Application', applicationSchema);
