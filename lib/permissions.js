import connectDB from './mongodb';
import User from '@/models/User';

export const VALID_ROLES = [
  'super_admin',
  'teacher',
  'adviser',
  'officer',
  'alumni',
  'member',
  'applicant',
  'user',
];

export const ALL_OFFICER_POSITIONS = [
  'president',
  'vice_president',
  'secretary',
  'treasurer',
  'pro',
  'pio',
  'events_director',
  'creative_director',
  'year_level_representative',
];

// Single-holder executive positions (strictly 1 member)
export const UNIQUE_OFFICER_POSITIONS = [
  'president',
  'vice_president',
  'secretary',
  'treasurer',
];

// Multi-holder positions (allows 2 or more members)
export const MULTI_OFFICER_POSITIONS = [
  'pro',
  'pio',
  'events_director',
  'creative_director',
  'year_level_representative',
];

export const POSITION_ORDER = {
  president: 1,
  vice_president: 2,
  secretary: 3,
  treasurer: 4,
  pro: 5,
  pio: 6,
  events_director: 7,
  creative_director: 8,
  year_level_representative: 9,
};

export function formatPosition(pos) {
  if (!pos) return 'Officer';
  if (pos.toLowerCase() === 'pro') return 'PRO';
  if (pos.toLowerCase() === 'pio') return 'PIO';
  return pos
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function isOfficerPosition(pos) {
  return ALL_OFFICER_POSITIONS.includes(pos);
}

export function isUniqueOfficerPosition(pos) {
  return UNIQUE_OFFICER_POSITIONS.includes(pos);
}

export function canManageMembers(user) {
  return Boolean(
    user && ['super_admin', 'teacher', 'adviser', 'officer'].includes(user.role)
  );
}

export function canDeleteMembers(user) {
  return Boolean(user && user.role === 'super_admin');
}

export function canViewMembers(user) {
  return Boolean(
    user &&
      ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member'].includes(
        user.role
      )
  );
}

export function canViewPortfolios(user) {
  return Boolean(
    user &&
      ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member'].includes(
        user.role
      )
  );
}

export function canManagePortfolios(user) {
  return Boolean(
    user &&
      ['super_admin', 'teacher', 'adviser', 'officer', 'member', 'alumni'].includes(
        user.role
      )
  );
}

export function canReviewApplications(user) {
  return Boolean(
    user && ['super_admin', 'teacher', 'adviser', 'officer'].includes(user.role)
  );
}

/**
 * Fetch fresh user record from the database to prevent stale token exploit.
 */
export async function getFreshUser(userId) {
  if (!userId) return null;
  await connectDB();
  return User.findById(userId).select(
    'firstName lastName email role officerPosition staffApprovalStatus'
  ).lean();
}
