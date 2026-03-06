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

module.exports = {
  hashPassword,
  comparePassword,
  isBcryptHash
};
