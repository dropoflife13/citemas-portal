// models/Portfolio.js
const mongoose = require('mongoose');

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
  },
  description: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    enum: ['traditional_arts', 'digital_arts', 'voice_acting', 'video_editing', 'photography'],
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
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
  },
}, { timestamps: true });

module.exports = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);