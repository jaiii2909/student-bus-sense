const { hashPassword } = require('../utils/passwords');

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.error('Usage: npm run hash:password -- <plainPassword>');
  process.exit(1);
}

hashPassword(plainPassword)
  .then((hash) => {
    console.log(hash);
  })
  .catch((error) => {
    console.error('Failed to hash password:', error.message);
    process.exit(1);
  });
