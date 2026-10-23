const bcrypt = require('bcryptjs');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$\d{2}\$/;

const isBcryptHash = (value) =>
  typeof value === 'string' && BCRYPT_HASH_PREFIX.test(value);

const hashPassword = async (plainTextPassword) => {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
};

const comparePassword = async (plainTextPassword, storedPassword) => {
  if (typeof storedPassword !== 'string') {
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
  hashPassword,
  comparePassword,
  isBcryptHash,
  newPasswordError
};
