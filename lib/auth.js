import jwt from 'jsonwebtoken';

export function generateToken(user) {
  return jwt.sign(
    { id: user._id?.toString() || user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, message: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user };
  } catch {
    return { success: false, message: 'Invalid or expired token' };
  }
}

// Reads and verifies the Authorization header, returns the decoded token payload
// (flat object: { id, email, role, iat, exp }) or null if missing/invalid.
// This is SYNCHRONOUS on purpose — every route in this app calls it without
// await, and relies on currentUser.id / currentUser.role directly.
export function getUserFromRequest(req) {
  const authResult = verifyAuth(req);
  return authResult.success ? authResult.user : null;
}