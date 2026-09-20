// Usage: node scripts/setRole.js someone@email.com officer president
// Usage: node scripts/setRole.js someone@email.com member
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  officerPosition: String,
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
  const email = process.argv[2];
  const role = process.argv[3];
  const position = process.argv[4] || null;

  const validRoles = ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member', 'applicant', 'user'];
  const validPositions = [
    'president', 'vice_president', 'secretary', 'treasurer',
    'pro', 'pio', 'events_director', 'creative_director', 'year_level_representative'
  ];

  if (!email || !role) {
    console.log('Usage: node scripts/setRole.js someone@email.com role [position]');
    process.exit(1);
  }
  if (!validRoles.includes(role)) {
    console.log(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }
  if (position && !validPositions.includes(position)) {
    console.log(`Invalid position. Must be one of: ${validPositions.join(', ')}`);
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);

  const update = { role, officerPosition: role === 'officer' ? position : null };
  if (role === 'teacher' || role === 'adviser') update.staffApprovalStatus = 'approved';
  const result = await User.findOneAndUpdate({ email }, update, { new: true });

  if (!result) {
    console.log(`No user found with email: ${email}`);
  } else {
    console.log(`✅ ${result.email} is now role: ${result.role}${result.officerPosition ? `, position: ${result.officerPosition}` : ''}`);
  }

  await mongoose.disconnect();
}

run();
