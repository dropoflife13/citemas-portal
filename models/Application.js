import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

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
  },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Application || mongoose.model('Application', applicationSchema);