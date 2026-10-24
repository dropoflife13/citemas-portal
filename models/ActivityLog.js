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

// Append-only invariant (DB-01, SEC-02): Disallow UPDATE/DELETE from any application path
ActivityLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  function () {
    throw new Error('ActivityLog is strictly append-only. Modification and deletion are prohibited.');
  }
);

ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ actor: 1, createdAt: -1 });

export default mongoose.models.ActivityLog ||
  mongoose.model('ActivityLog', ActivityLogSchema);
