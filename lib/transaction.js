import mongoose from 'mongoose';

function isStandaloneTransactionError(err) {
  if (!err) return false;
  if (err.code === 20 || err.codeName === 'IllegalOperation') return true;
  const msg = String(err.message || '');
  return msg.includes('Transaction numbers are only allowed on a replica set member');
}

/**
 * Runs `work(session)` inside a MongoDB transaction when supported (replica set / Atlas).
 * Falls back cleanly to running `work(null)` on standalone dev MongoDB instances.
 */
export async function runInTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    if (isStandaloneTransactionError(err)) {
      return await work(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
