import { z } from 'zod';

// Advisers are the single staff account type. Legacy `teacher` roles remain
// readable in the rest of the app so existing staff accounts keep working.
export const ACCOUNT_TYPES = ['student', 'adviser'];
export const YEAR_LEVELS = ['1st', '2nd', '3rd', '4th', 'Graduate'];

export const DEPARTMENTS = [
  'College of Arts & Sciences (CAS)',
  'College of Accountancy',
  'College of Allied Health Sciences (CAHS)',
  'College of Criminal Justice Education (CCJE)',
  'College of Education (CoEd)',
  'College of Engineering',
  'College of Information Technology Education (CITE)',
  'College of Management (COM)',
  'College of Maritime Education (COME)',
  'BS Information Technology',
  'BS Computer Science',
  'BS Business Administration',
  'BS Accountancy',
  'BS Hospitality Management',
  'BS Tourism Management',
  'Bachelor of Elementary Education',
  'Bachelor of Secondary Education',
  'Bachelor of Science in Nursing',
];

export const SPECIALIZATIONS = ['traditional_arts', 'digital_arts', 'voice_acting', 'video_editing', 'photography'];

// PHINMA University of Iloilo student numbers, for example: 04-2122-033338.
export const STUDENT_ID_PATTERN = /^04-\d{4}-\d{6}$/;

// Staff identifiers vary by issuing office. This deliberately accepts only a
// distinct, uppercase institutional identifier (not a student number).
export const STAFF_ID_PATTERN = /^(?=.*[A-Z])[A-Z0-9-]{4,32}$/;

const emailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address.');
const optionalText = z.string().trim().optional().or(z.literal(''));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(3, 'Password must be at least 3 characters long.'),
});

export const registerSchema = z.object({
  accountType: z.enum(ACCOUNT_TYPES, 'Choose whether you are registering as a student or adviser.'),
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  studentId: optionalText,
  staffId: optionalText,
  yearLevel: z.enum(YEAR_LEVELS).optional().or(z.literal('')),
  department: z.enum(DEPARTMENTS, 'Choose your department.').optional().or(z.literal('')),
  specialization: z.enum(SPECIALIZATIONS).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.accountType === 'student') {
    if (!data.email.endsWith('@phinmaed.com')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Student accounts must use a PHINMA email ending in @phinmaed.com.',
      });
    }

    if (!STUDENT_ID_PATTERN.test(data.studentId || '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studentId'],
        message: 'Use the student ID format 04-2122-033338.',
      });
    }

    if (!data.yearLevel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['yearLevel'], message: 'Choose your year level.' });
    }
    if (!data.department) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['department'], message: 'Choose your department.' });
    }
    if (!data.specialization) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['specialization'], message: 'Choose your specialization.' });
    }
    return;
  }

  const staffId = (data.staffId || '').toUpperCase();
  if (!STAFF_ID_PATTERN.test(staffId) || STUDENT_ID_PATTERN.test(staffId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['staffId'],
      message: 'Enter the institution-issued staff ID (4–32 letters, numbers, or hyphens; not a student ID).',
    });
  }

  if (!data.department) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['department'], message: 'Choose your department.' });
  }
});

export const profilePatchSchema = z.object({
  firstName: z.string().trim().min(1).optional().or(z.literal('')),
  lastName: z.string().trim().min(1).optional().or(z.literal('')),
  phone: optionalText,
  bio: optionalText,
  yearLevel: z.enum(YEAR_LEVELS).optional().or(z.literal('')),
  department: z.enum(DEPARTMENTS).optional().or(z.literal('')),
  specialization: z.enum(SPECIALIZATIONS).optional().or(z.literal('')),
}).transform((data) => {
  const cleaned = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    cleaned[key] = value;
  });
  return cleaned;
});

const schoolEmailSchema = emailSchema.refine(
  (email) => email.endsWith('@phinmaed.com'),
  'Use your PHINMA email ending in @phinmaed.com.'
);

export const passwordResetRequestSchema = z.object({
  email: schoolEmailSchema,
});

export const passwordResetConfirmSchema = z.object({
  email: schoolEmailSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});
