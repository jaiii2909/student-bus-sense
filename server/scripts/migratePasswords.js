const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const { hashPassword, isBcryptHash } = require('../utils/passwords');
require('dotenv').config();

const migrateCollection = async (Model, modelName) => {
  const docs = await Model.find().select('+password');
  let migrated = 0;

  for (const doc of docs) {
    if (!doc.password || isBcryptHash(doc.password)) {
      continue;
    }

    doc.password = await hashPassword(doc.password);
    await doc.save();
    migrated += 1;
  }

  console.log(`${modelName}: migrated ${migrated}/${docs.length} records`);
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await migrateCollection(Admin, 'Admin');
  await migrateCollection(Student, 'Student');

  await mongoose.disconnect();
  console.log('Password migration completed.');
};

run().catch(async (error) => {
  console.error('Password migration failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
