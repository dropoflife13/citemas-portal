import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { requireFreshUser } from '@/lib/permissions';

const ADMIN_ROLES = ['super_admin', 'teacher', 'adviser', 'officer'];

export async function GET(req) {
  const { user: fresh, error, status } = await requireFreshUser(req);
  if (error) {
    return NextResponse.json({ message: error }, { status });
  }

  if (!ADMIN_ROLES.includes(fresh.role)) {
    return NextResponse.json({ message: 'Admins only' }, { status: 403 });
  }

  try {
    await connectDB();

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const actor = url.searchParams.get('actor');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);

    const query = {};
    if (action && action !== 'all') {
      const escapedAction = action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.action = { $regex: `^${escapedAction}` };
    }
    if (actor) query.actor = actor;

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('Activity fetch error:', err);
    return NextResponse.json(
      { message: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}