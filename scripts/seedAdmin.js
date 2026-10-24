require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const rawUri = process.env.MONGODB_URI;

if (!rawUri) {
  console.error('❌ MONGODB_URI is not defined in environment or .env.local');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String },
  role: { type: String, default: 'super_admin' },
  officerPosition: { type: String, default: null },
  yearLevel: { type: String, default: 'Graduate' },
  department: { type: String, default: 'College of Information Technology Education (CITE)' },
  specialization: { type: String, default: 'digital_arts' },
  accountType: { type: String, default: 'student' },
  applicationStatus: { type: String, default: 'not_applied' },
  portfolioCount: { type: Number, default: 0 },
}, { timestamps: true, strict: false });

async function seedAdmin() {
  const adminEmail = 'neilasis43@gmail.com';
  const plainPassword = '12345678';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const adminData = {
    firstName: 'Neil Mar',
    lastName: 'Admin',
    email: adminEmail,
    password: hashedPassword,
    studentId: 'ADMIN-001',
    role: 'super_admin',
    officerPosition: null,
    yearLevel: 'Graduate',
    department: 'College of Information Technology Education (CITE)',
    specialization: 'digital_arts',
    accountType: 'student',
    applicationStatus: 'not_applied',
  };

  // Seed primary configured database
  console.log('Connecting to primary MongoDB URI...');
  await mongoose.connect(rawUri);
  const User = mongoose.models.User || mongoose.model('User', userSchema);

  const updatedUser = await User.findOneAndUpdate(
    { email: adminEmail },
    { $set: adminData },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  console.log(`✅ Super Admin seeded in database [${mongoose.connection.name}]:`);
  console.log({
    id: updatedUser._id,
    name: `${updatedUser.firstName} ${updatedUser.lastName}`,
    email: updatedUser.email,
    role: updatedUser.role,
  });

  const isMatch = await bcrypt.compare(plainPassword, updatedUser.password);
  console.log(`Password verification ('${plainPassword}'):`, isMatch ? 'PASSED ✅' : 'FAILED ❌');
  await mongoose.disconnect();

  // If URI matches Atlas cluster, also ensure dev/test/local databases have it so all environments work seamlessly
  const match = rawUri.match(/^(mongodb\+srv:\/\/[^/]+)\/?([^?]*)(\?.*)?$/);
  if (match) {
    const clusterPrefix = match[1];
    const query = match[3] || '';
    const otherDbs = ['citemas-local', 'citemasdev', 'test'].filter(d => d !== mongoose.connection.name);

    for (const dbName of otherDbs) {
      try {
        const extraUri = `${clusterPrefix}/${dbName}${query}`;
        const extraConn = await mongoose.createConnection(extraUri).asPromise();
        await extraConn.collection('users').updateOne(
          { email: adminEmail },
          { $set: adminData },
          { upsert: true }
        );
        console.log(`✅ Synced admin to database [${dbName}]`);
        await extraConn.close();
      } catch (err) {
        console.warn(`Could not sync to ${dbName}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Admin seeding complete. You can now log in with:');
  console.log('   Email:    neilasis43@gmail.com');
  console.log('   Password: 12345678\n');
}

seedAdmin().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
