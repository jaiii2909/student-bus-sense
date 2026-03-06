const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Student = require('./models/Student');
const Route = require('./models/Route');
const Bus = require('./models/Bus');
const { hashPassword } = require('./utils/passwords');

require('dotenv').config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // purge collections
  await Admin.deleteMany({});
  await Student.deleteMany({});
  await Route.deleteMany({});
  await Bus.deleteMany({});
  // remove any leftover index on old `id` field which is no longer in schema
  try {
    await Bus.collection.dropIndex('id_1');
  } catch (e) {
    // ignore if index doesn't exist
  }
  try {
    await Student.collection.dropIndex('id_1');
  } catch (e) {
    // ignore if index doesn't exist
  }

  // admin user
  await Admin.create({ username: 'admin', password: await hashPassword('admin123') });

  // routes
  const routeNames = ['Rajroohpur', 'Kareli', 'Dhoomanganj'];
  await Route.insertMany(routeNames.map(r => ({ routeName: r })));

  // buses
  const buses = [
    { busNumber: 'R1', route: 'Rajroohpur', status: 'active' },
    { busNumber: 'R2', route: 'Rajroohpur', status: 'active' },
    { busNumber: 'R3', route: 'Rajroohpur', status: 'active' },
    { busNumber: 'K1', route: 'Kareli', status: 'active' },
    { busNumber: 'K2', route: 'Kareli', status: 'active' },
    { busNumber: 'K3', route: 'Kareli', status: 'active' },
    { busNumber: 'D1', route: 'Dhoomanganj', status: 'active' },
    { busNumber: 'D2', route: 'Dhoomanganj', status: 'active' },
    { busNumber: 'D3', route: 'Dhoomanganj', status: 'active' }
  ];
  await Bus.insertMany(buses);

  // students
  const students = [
    { studentId: 'STU001', name: 'John Doe', password: await hashPassword('pass1'), registeredRoutes: routeNames },
    { studentId: 'STU002', name: 'Jane Smith', password: await hashPassword('pass2'), registeredRoutes: routeNames },
    { studentId: 'STU003', name: 'Baccha badass', password: await hashPassword('pass3'), registeredRoutes: routeNames }
  ];
  await Student.insertMany(students);

  console.log('Data seeded');
  process.exit();
};

seedData();
