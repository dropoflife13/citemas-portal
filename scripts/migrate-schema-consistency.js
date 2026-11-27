import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const isDryRun = process.argv.includes('--dry-run');
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const users = mongoose.connection.collection('users');

  console.log(`Connected to MongoDB (${isDryRun ? 'DRY RUN' : 'APPLY MODE'}).`);

  // 1. Backfill tokenVersion: 0 where missing
  const missingTokenVersionFilter = { tokenVersion: { $exists: false } };
  if (isDryRun) {
    const count = await users.countDocuments(missingTokenVersionFilter);
    console.log(`[dry-run] users missing tokenVersion: ${count}`);
  } else {
    const res = await users.updateMany(missingTokenVersionFilter, {
      $set: { tokenVersion: 0 },
    });
    console.log(
      `[tokenVersion backfill] matched=${res.matchedCount}, modified=${res.modifiedCount}`
    );
  }

  // 2. Unset legacy/redundant fields: isAlumni and portfolioCount
  const legacyFieldsFilter = {
    $or: [{ isAlumni: { $exists: true } }, { portfolioCount: { $exists: true } }],
  };
  if (isDryRun) {
    const count = await users.countDocuments(legacyFieldsFilter);
    console.log(`[dry-run] users with isAlumni or portfolioCount: ${count}`);
  } else {
    const res = await users.updateMany(legacyFieldsFilter, {
      $unset: { isAlumni: '', portfolioCount: '' },
    });
    console.log(
      `[unset isAlumni/portfolioCount] matched=${res.matchedCount}, modified=${res.modifiedCount}`
    );
  }

  // 3. Unset officerPosition where explicitly null (prevents mixed BSON type in ERD)
  const nullOfficerPosFilter = { officerPosition: null };
  if (isDryRun) {
    const count = await users.countDocuments(nullOfficerPosFilter);
    console.log(`[dry-run] users with officerPosition: null: ${count}`);
  } else {
    const res = await users.updateMany(nullOfficerPosFilter, {
      $unset: { officerPosition: '' },
    });
    console.log(
      `[unset officerPosition:null] matched=${res.matchedCount}, modified=${res.modifiedCount}`
    );
  }

  await mongoose.disconnect();
  console.log('Migration complete.');
}

run().catch(async (err) => {
  console.error('Migration failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
