import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id?.toString() || user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

function extractToken(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // Fallback to citemas_token cookie if present
  const cookieToken = req.cookies?.get?.('citemas_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('citemas_token='));
    if (match) {
      return decodeURIComponent(match.slice('citemas_token='.length));
    }
  }

  return null;
}

export function verifyAuth(req) {
  const token = extractToken(req);
  if (!token) {
    return { success: false, message: 'Missing or invalid Authorization header' };
  }

  try {
    const user = jwt.verify(token, getJwtSecret());
    return { success: true, user };
  } catch {
    return { success: false, message: 'Invalid or expired token' };
  }
}

// Checks that a decoded JWT's tokenVersion matches the fresh DB user's tokenVersion.
export function isTokenVersionValid(decodedUser, freshUser) {
  if (!decodedUser || !freshUser) return false;
  return (decodedUser.tokenVersion ?? 0) === (freshUser.tokenVersion ?? 0);
}

// Reads and verifies the Authorization header, returns the decoded token payload
// (flat object: { id, email, role, iat, exp }) or null if missing/invalid.
// This is SYNCHRONOUS on purpose — every route in this app calls it without
// await, and relies on currentUser.id / currentUser.role directly.
export function getUserFromRequest(req) {
  const authResult = verifyAuth(req);
  return authResult.success ? authResult.user : null;
}
