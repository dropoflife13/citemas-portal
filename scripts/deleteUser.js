// Usage: node scripts/deleteUser.js someone@email.com
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({ email: String }, { strict: false });
const User = mongoose.model('User', userSchema);

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/deleteUser.js someone@email.com');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const result = await User.deleteOne({ email });

  if (result.deletedCount === 0) {
    console.log(`No user found with email: ${email}`);
  } else {
    console.log(`✅ Deleted user: ${email}`);
  }

  await mongoose.disconnect();
}

run();