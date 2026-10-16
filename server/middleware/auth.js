const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Without JWT_SECRET, tokens are signed with a per-process secret: everything
// still works, but users are logged out whenever the server restarts.
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set; sessions will reset on every server restart.');
}

const TOKEN_TTL = { admin: '12h', driver: '12h', student: '7d' };

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL[payload.role] || '12h' });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// Express middleware: only allow requests carrying a valid token for one of `roles`.
const requireRole = (...roles) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = token && verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Please log in again' });
  }
  if (!roles.includes(user.role)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  req.user = user;
  next();
};

module.exports = { signToken, verifyToken, requireRole };
