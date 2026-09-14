import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';

export async function logActivity({
  req,
  actor,
  action,
  targetType,
  targetId,
  targetName,
  metadata,
}) {
  try {
    if (!actor) return;

    await connectDB();

    const ip =
      req?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req?.headers?.get('x-real-ip') ||
      'unknown';
    const userAgent = req?.headers?.get('user-agent') || 'unknown';

    const actorName =
      actor.name ||
      `${actor.firstName || ''} ${actor.lastName || ''}`.trim() ||
      actor.email ||
      'unknown';

    await ActivityLog.create({
      actor: actor.id || actor._id,
      actorName,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      targetName,
      metadata,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error('Activity log failed:', err);
  }
}