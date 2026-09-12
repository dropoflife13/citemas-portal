import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  studentId: { type: String, unique: true, sparse: true },
  staffId: { type: String, unique: true, sparse: true },
  accountType: {
    type: String,
    enum: ['student', 'adviser'],
    default: 'student',
  },
  staffApprovalStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'approved'],
    default: 'not_applicable',
  },
  yearLevel: { type: String, enum: ['1st', '2nd', '3rd', '4th', 'Graduate'] },
  
  department: {
    type: String,
    enum: [
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
    ],
  },

  role: {
    type: String,
    enum: ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member', 'applicant', 'user'],
    default: 'user'
  },
  
  officerPosition: {
    type: String,
    enum: [
      'president',
      'vice_president',
      'secretary',
      'treasurer',
      'pro',
      'events_director',
      'creative_director',
      'year_level_representative'
    ],
    default: null,
  },

  specialization: {
    type: String,
    enum: ['traditional_arts', 'digital_arts', 'voice_acting', 'video_editing', 'photography']
  },
  
  isAlumni: { type: Boolean, default: false },
  graduationYear: { type: Number },

  phone: { type: String },
  bio: { type: String },

  applicationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_applied'],
    default: 'not_applied'
  },
  applicationDate: { type: Date },

  portfolioCount: { type: Number, default: 0 },

  passwordResetCodeHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  passwordResetAttempts: { type: Number, default: 0, select: false },
  passwordResetLastRequestedAt: { type: Date, select: false },

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password when converting to JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

// Virtual field to get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual field to check if user is an officer
userSchema.virtual('isOfficer').get(function() {
  return this.role === 'officer' && this.officerPosition !== null;
});

// Virtual field to get formatted officer position
userSchema.virtual('formattedOfficerPosition').get(function() {
  if (!this.officerPosition) return null;
  return this.officerPosition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

// Virtual field to get graduation year display
userSchema.virtual('graduationYearDisplay').get(function() {
  if (!this.graduationYear) return null;
  return `Class of ${this.graduationYear}`;
});

export default mongoose.models.User || mongoose.model('User', userSchema);
