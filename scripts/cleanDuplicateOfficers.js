// Usage: node scripts/cleanDuplicateOfficers.js
// Scans for duplicate single-holder officer roles (president, vice_president, secretary, treasurer)
// and ensures each is assigned to at most one member.

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const UNIQUE_POSITIONS = ['president', 'vice_president', 'secretary', 'treasurer'];

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  let duplicatesFound = 0;

  for (const position of UNIQUE_POSITIONS) {
    const matching = await usersCollection
      .find({ role: 'officer', officerPosition: position })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    if (matching.length > 1) {
      duplicatesFound += matching.length - 1;
      console.warn(`⚠️ Found ${matching.length} members with duplicate position: "${position}"`);
      // Keep the most recently updated one, clear the rest
      const [keep, ...removeList] = matching;
      console.log(`  Keeping: ${keep.firstName} ${keep.lastName} (${keep.email}) [ID: ${keep._id}]`);

      for (const dupe of removeList) {
        console.log(`  Clearing position for: ${dupe.firstName} ${dupe.lastName} (${dupe.email}) [ID: ${dupe._id}]`);
        await usersCollection.updateOne(
          { _id: dupe._id },
          { $set: { officerPosition: null } }
        );
      }
    } else if (matching.length === 1) {
      console.log(`✓ ${position}: 1 member (${matching[0].firstName} ${matching[0].lastName})`);
    } else {
      console.log(`✓ ${position}: unassigned`);
    }
  }

  console.log('\nEnsuring partial unique index on users collection...');
  try {
    await usersCollection.createIndex(
      { officerPosition: 1 },
      {
        unique: true,
        partialFilterExpression: {
          role: 'officer',
          officerPosition: { $in: UNIQUE_POSITIONS },
        },
        name: 'unique_executive_officer_position',
      }
    );
    console.log('✅ Partial unique index unique_executive_officer_position created/verified.');
  } catch (err) {
    console.error('Error creating index:', err.message);
  }

  await mongoose.disconnect();
  console.log(`Done! Reconciled ${duplicatesFound} duplicate officer assignments.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
