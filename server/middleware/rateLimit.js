const rateLimit = require('express-rate-limit');

// Slow down password guessing: only failed logins count, so many students
// signing in from the same college network are not blocked.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS || 20),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many failed attempts. Please wait 15 minutes and try again.' }
});

module.exports = { loginLimiter };
