const bcrypt = require('bcryptjs');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;

const isBcryptHash = (value) =>
  typeof value === 'string' && BCRYPT_HASH_PREFIX.test(value);

// rounds can be lowered for bulk imports (still within the recommended minimum of 10)
const hashPassword = async (plainTextPassword, rounds = SALT_ROUNDS) => {
  return bcrypt.hash(plainTextPassword, rounds);
};

const comparePassword = async (plainTextPassword, storedPassword) => {
  if (typeof plainTextPassword !== 'string' || typeof storedPassword !== 'string') {
    return false;
  }
  return bcrypt.compare(plainTextPassword, storedPassword);
};

// returns an error message, or null when the new password is acceptable
const newPasswordError = (password, minLength) => {
  if (typeof password !== 'string' || password.length < minLength) {
    return `New password must be at least ${minLength} characters`;
  }
  if (password.length > 72) {
    return 'New password must be at most 72 characters';
  }
  return null;
};

module.exports = {
  SALT_ROUNDS,
  hashPassword,
  comparePassword,
  isBcryptHash,
  newPasswordError
};
