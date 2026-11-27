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

    let cleanMetadata;
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      const entries = Object.entries(metadata).filter(
        ([, value]) => value !== null && value !== undefined
      );
      if (entries.length > 0) {
        cleanMetadata = Object.fromEntries(entries);
      }
    }

    await ActivityLog.create({
      actor: actor.id || actor._id,
      actorName,
      actorRole: actor.role,
      action,
      targetType,
      targetId,
      targetName,
      ...(cleanMetadata ? { metadata: cleanMetadata } : {}),
      ip,
      userAgent,
    });
  } catch (err) {
    console.error('Activity log failed:', err);
  }
}