import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: {
    type: String,
    required: true,
    index: true,
  },
  targetType: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetName: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.models.ActivityLog ||
  mongoose.model('ActivityLog', ActivityLogSchema);