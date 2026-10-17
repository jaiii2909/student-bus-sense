// API tests. Run with: npm test (inside server/)
// Needs a local MongoDB; uses (and wipes) a separate test database.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/busSenseTest';
if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)[:/]/.test(TEST_MONGO_URI) || !/test/i.test(TEST_MONGO_URI)) {
  throw new Error('TEST_MONGO_URI must point to a local database with "test" in its name');
}

// set before the server loads (dotenv never overrides existing values)
process.env.JWT_SECRET = 'test-secret';
process.env.DRIVER_PASSWORD_HASH = '';
process.env.DRIVER_PASSWORD = 'driver-test';
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.LOGIN_MAX_FAILED_ATTEMPTS = '1000';
process.env.CORS_ORIGINS = '';

const mongoose = require('mongoose');
const { server, io } = require('../server');
const Admin = require('../models/Admin');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Student = require('../models/Student');
const { hashPassword } = require('../utils/passwords');

let baseUrl;

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

const login = async (role, body) => (await api('POST', `/api/${role}/login`, { body })).data.token;

before(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([Admin.init(), Bus.init(), Route.init(), Student.init()]);

  await Admin.create({ username: 'admin', password: await hashPassword('admin-pass') });
  await Route.insertMany([{ routeName: 'North' }, { routeName: 'South' }]);
  await Bus.insertMany([
    { busNumber: 'N1', route: 'North' },
    { busNumber: 'S1', route: 'South' }
  ]);
  await Student.insertMany([
    { studentId: 'S001', name: 'Asha', password: await hashPassword('pass1'), registeredRoutes: ['North'] },
    { studentId: 'S002', name: 'Ravi', password: await hashPassword('pass2'), registeredRoutes: ['South'] }
  ]);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  io.close();
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('health check responds', async () => {
  const res = await api('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.ok, true);
  assert.equal(res.data.db, true);
});

test('student login rejects a wrong password', async () => {
  const res = await api('POST', '/api/student/login', { body: { studentId: 'S001', password: 'nope' } });
  assert.equal(res.status, 401);
});

test('student login returns a token and never the password', async () => {
  const res = await api('POST', '/api/student/login', { body: { studentId: 'S001', password: 'pass1' } });
  assert.equal(res.status, 200);
  assert.ok(res.data.token);
  assert.equal(res.data.password, undefined);
});

test('admin endpoints need a token', async () => {
  const res = await api('GET', '/api/admin/buses');
  assert.equal(res.status, 401);
});

test('a student token cannot use admin endpoints', async () => {
  const token = await login('student', { studentId: 'S001', password: 'pass1' });
  const res = await api('GET', '/api/admin/buses', { token });
  assert.equal(res.status, 403);
});

test('a student only sees buses on their own routes', async () => {
  const token = await login('student', { studentId: 'S001', password: 'pass1' });
  const res = await api('GET', '/api/student/S001/authorized-buses', { token });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.buses.map((b) => b.number), ['N1']);
});

test("a student cannot read another student's buses", async () => {
  const token = await login('student', { studentId: 'S001', password: 'pass1' });
  const res = await api('GET', '/api/student/S002/authorized-buses', { token });
  assert.equal(res.status, 403);
});

test('adding a duplicate bus number returns 409', async () => {
  const token = await login('admin', { username: 'admin', password: 'admin-pass' });
  const res = await api('POST', '/api/admin/buses', { token, body: { busNumber: 'N1', route: 'North' } });
  assert.equal(res.status, 409);
});

test('renaming a route updates its buses and students', async () => {
  const token = await login('admin', { username: 'admin', password: 'admin-pass' });
  const route = await Route.findOne({ routeName: 'North' });
  const res = await api('PUT', `/api/admin/routes/${route._id}`, { token, body: { routeName: 'North Line' } });
  assert.equal(res.status, 200);
  assert.equal((await Bus.findOne({ busNumber: 'N1' })).route, 'North Line');
  assert.deepEqual((await Student.findOne({ studentId: 'S001' })).registeredRoutes, ['North Line']);
});

test('deleting a route is blocked while buses use it', async () => {
  const token = await login('admin', { username: 'admin', password: 'admin-pass' });
  const route = await Route.findOne({ routeName: 'South' });

  const blocked = await api('DELETE', `/api/admin/routes/${route._id}`, { token });
  assert.equal(blocked.status, 409);

  const bus = await Bus.findOne({ busNumber: 'S1' });
  assert.equal((await api('DELETE', `/api/admin/buses/${bus._id}`, { token })).status, 200);

  const allowed = await api('DELETE', `/api/admin/routes/${route._id}`, { token });
  assert.equal(allowed.status, 200);
  assert.deepEqual((await Student.findOne({ studentId: 'S002' })).registeredRoutes, []);
});

test('driver sharing marks the bus running, stopping marks it not running', async () => {
  const token = await login('driver', { password: 'driver-test' });
  assert.ok(token);

  const bad = await api('POST', '/api/driver/buses/N1/location', { token, body: { latitude: 'x', longitude: 1 } });
  assert.equal(bad.status, 400);

  const shared = await api('POST', '/api/driver/buses/N1/location', { token, body: { latitude: 25.4, longitude: 81.8 } });
  assert.equal(shared.status, 200);
  assert.equal((await Bus.findOne({ busNumber: 'N1' })).status, 'active');

  const stopped = await api('POST', '/api/driver/buses/N1/stop', { token });
  assert.equal(stopped.status, 200);
  assert.equal((await Bus.findOne({ busNumber: 'N1' })).status, 'inactive');
});
