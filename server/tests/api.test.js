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

test('admin can save route stops; invalid stops are rejected', async () => {
  const token = await login('admin', { username: 'admin', password: 'admin-pass' });
  const route = await Route.findOne({ routeName: 'North Line' });

  const bad = await api('PUT', `/api/admin/routes/${route._id}/stops`, {
    token,
    body: { stops: [{ name: '', lat: 25.4, lng: 81.8 }] }
  });
  assert.equal(bad.status, 400);

  const stops = [
    { name: 'Gate 1', lat: 25.43, lng: 81.84 },
    { name: 'Civil Lines', lat: 25.45, lng: 81.83 }
  ];
  const saved = await api('PUT', `/api/admin/routes/${route._id}/stops`, { token, body: { stops } });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data.stops, stops);
});

test('a student gets the stops of their routes and the bus speed', async () => {
  const driverToken = await login('driver', { password: 'driver-test' });
  await api('POST', '/api/driver/buses/N1/location', {
    token: driverToken,
    body: { latitude: 25.44, longitude: 81.84, speedKmh: 32 }
  });
  const bus = await Bus.findOne({ busNumber: 'N1' });
  assert.equal((await mongoose.model('Location').findOne({ busId: bus._id })).speedKmh, 32);
  // nonsense speed is stored as unknown, not rejected
  await api('POST', '/api/driver/buses/N1/location', {
    token: driverToken,
    body: { latitude: 25.44, longitude: 81.84, speedKmh: 999 }
  });

  const token = await login('student', { studentId: 'S001', password: 'pass1' });
  const res = await api('GET', '/api/student/S001/authorized-buses', { token });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.routes.map((r) => [r.routeName, r.stops.length]), [['North Line', 2]]);
  assert.equal(res.data.buses[0].speedKmh, null);
});

/* ---------------- announcements ---------------- */

const inHours = (h) => new Date(Date.now() + h * 60 * 60 * 1000).toISOString();

test('announcements: admin creates them, students only see their routes and all-route ones', async () => {
  const admin = await login('admin', { username: 'admin', password: 'admin-pass' });

  const mine = await api('POST', '/api/admin/announcements', {
    token: admin, body: { message: 'N1 delayed 10 min', route: 'North Line', expiresAt: inHours(2) }
  });
  assert.equal(mine.status, 200);
  const all = await api('POST', '/api/admin/announcements', {
    token: admin, body: { message: 'No buses Monday', route: null, expiresAt: inHours(24) }
  });
  assert.equal(all.status, 200);

  assert.equal((await api('POST', '/api/admin/announcements', {
    token: admin, body: { message: 'x', route: 'Nowhere', expiresAt: inHours(1) }
  })).status, 400);
  assert.equal((await api('POST', '/api/admin/announcements', {
    token: admin, body: { message: 'x', route: null, expiresAt: inHours(-1) }
  })).status, 400);
  assert.equal((await api('POST', '/api/admin/announcements', {
    token: admin, body: { message: '', route: null, expiresAt: inHours(1) }
  })).status, 400);

  // already expired (TTL cleanup is not instant) must not be shown
  const Announcement = mongoose.model('Announcement');
  await Announcement.create({ message: 'old news', route: null, expiresAt: new Date(Date.now() - 1000) });

  const s1 = await login('student', { studentId: 'S001', password: 'pass1' });
  const res1 = await api('GET', '/api/student/S001/authorized-buses', { token: s1 });
  assert.deepEqual(res1.data.announcements.map((a) => a.message).sort(), ['N1 delayed 10 min', 'No buses Monday']);

  // S002 has no routes left, so only the all-route message
  const s2 = await login('student', { studentId: 'S002', password: 'pass2' });
  const res2 = await api('GET', '/api/student/S002/authorized-buses', { token: s2 });
  assert.deepEqual(res2.data.announcements.map((a) => a.message), ['No buses Monday']);

  // students cannot post; admin can delete
  assert.equal((await api('POST', '/api/admin/announcements', {
    token: s1, body: { message: 'hi', route: null, expiresAt: inHours(1) }
  })).status, 403);
  assert.equal((await api('DELETE', `/api/admin/announcements/${mine.data.id}`, { token: admin })).status, 200);
  const list = await api('GET', '/api/admin/announcements', { token: admin });
  assert.deepEqual(list.data.map((a) => a.message), ['No buses Monday']);
});

/* ---------------- passwords ---------------- */

test('a student can change their own password', async () => {
  const token = await login('student', { studentId: 'S001', password: 'pass1' });

  const wrong = await api('POST', '/api/student/password', {
    token, body: { currentPassword: 'nope', newPassword: 'newpass1' }
  });
  assert.equal(wrong.status, 401);
  const short = await api('POST', '/api/student/password', {
    token, body: { currentPassword: 'pass1', newPassword: '123' }
  });
  assert.equal(short.status, 400);

  const ok = await api('POST', '/api/student/password', {
    token, body: { currentPassword: 'pass1', newPassword: 'newpass1' }
  });
  assert.equal(ok.status, 200);
  // the returned token keeps this device logged in
  assert.equal((await api('GET', '/api/student/S001/authorized-buses', { token: ok.data.token })).status, 200);

  assert.equal((await api('POST', '/api/student/login', { body: { studentId: 'S001', password: 'pass1' } })).status, 401);
  assert.equal((await api('POST', '/api/student/login', { body: { studentId: 'S001', password: 'newpass1' } })).status, 200);
});

test('an admin reset logs the student out everywhere', async () => {
  const oldToken = await login('student', { studentId: 'S001', password: 'newpass1' });
  const admin = await login('admin', { username: 'admin', password: 'admin-pass' });
  const student = await Student.findOne({ studentId: 'S001' });

  // students cannot reset passwords
  assert.equal((await api('PUT', `/api/admin/students/${student._id}/password`, {
    token: oldToken, body: { newPassword: 'reset123' }
  })).status, 403);

  // make sure the reset happens in a later second than the old login
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const reset = await api('PUT', `/api/admin/students/${student._id}/password`, {
    token: admin, body: { newPassword: 'reset123' }
  });
  assert.equal(reset.status, 200);

  assert.equal((await api('GET', '/api/student/S001/authorized-buses', { token: oldToken })).status, 401);
  assert.equal((await api('POST', '/api/student/login', { body: { studentId: 'S001', password: 'reset123' } })).status, 200);
});

test('an admin can change their own password', async () => {
  const token = await login('admin', { username: 'admin', password: 'admin-pass' });

  assert.equal((await api('POST', '/api/admin/password', {
    token, body: { currentPassword: 'wrong', newPassword: 'new-admin-pass' }
  })).status, 401);
  assert.equal((await api('POST', '/api/admin/password', {
    token, body: { currentPassword: 'admin-pass', newPassword: 'short' }
  })).status, 400);
  // a second admin session opened earlier must end after the change
  const otherSession = await login('admin', { username: 'admin', password: 'admin-pass' });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const changed = await api('POST', '/api/admin/password', {
    token, body: { currentPassword: 'admin-pass', newPassword: 'new-admin-pass' }
  });
  assert.equal(changed.status, 200);
  assert.equal((await api('GET', '/api/admin/buses', { token: otherSession })).status, 401);
  // the session that changed it continues with the returned token
  assert.equal((await api('GET', '/api/admin/buses', { token: changed.data.token })).status, 200);

  assert.equal((await api('POST', '/api/admin/login', { body: { username: 'admin', password: 'admin-pass' } })).status, 401);
  assert.equal((await api('POST', '/api/admin/login', { body: { username: 'admin', password: 'new-admin-pass' } })).status, 200);
});

/* ---------------- CSV import + pass expiry ---------------- */

test('importing students adds valid rows and reports skipped ones', async () => {
  const admin = await login('admin', { username: 'admin', password: 'new-admin-pass' });
  const res = await api('POST', '/api/admin/students/import', {
    token: admin,
    body: {
      students: [
        { row: 2, studentId: 'IMP1', name: 'Imported One', password: 'secret1', routes: ['North Line'] },
        { row: 3, studentId: 'IMP2', name: 'Imported Two', password: 'secret2', routes: [] },
        { row: 4, studentId: 'S001', name: 'Existing', password: 'secret3', routes: [] },
        { row: 5, studentId: 'IMP1', name: 'Repeat', password: 'secret4', routes: [] },
        { row: 6, studentId: 'IMP3', name: 'Bad Route', password: 'secret5', routes: ['Nowhere'] },
        { row: 7, studentId: 'IMP4', name: 'Short Pw', password: '123', routes: [] },
        { row: 8, studentId: '', name: 'No Id', password: 'secret6', routes: [] }
      ]
    }
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.added, 2);
  assert.deepEqual(res.data.skipped.map((s) => s.row), [4, 5, 6, 7, 8]);
  assert.match(res.data.skipped.find((s) => s.row === 6).reason, /Unknown route/);

  // imported students can log in and see their routes
  const login1 = await api('POST', '/api/student/login', { body: { studentId: 'IMP1', password: 'secret1' } });
  assert.equal(login1.status, 200);
  assert.deepEqual(login1.data.registeredRoutes, ['North Line']);

  // non-admins cannot import
  assert.equal((await api('POST', '/api/admin/students/import', {
    token: login1.data.token, body: { students: [{ studentId: 'X', name: 'X', password: 'secret1' }] }
  })).status, 403);
});

test('an expired pass blocks login and ends existing sessions', async () => {
  const admin = await login('admin', { username: 'admin', password: 'new-admin-pass' });
  const student = await Student.findOne({ studentId: 'IMP2' });
  const token = await login('student', { studentId: 'IMP2', password: 'secret2' });

  // a future end date still works
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  assert.equal((await api('PUT', `/api/admin/students/${student._id}/routes`, {
    token: admin, body: { registeredRoutes: [], accessValidUntil: future }
  })).status, 200);
  assert.equal((await api('GET', '/api/student/IMP2/authorized-buses', { token })).status, 200);

  // once it has passed, the open session and new logins are refused
  const past = new Date(Date.now() - 60 * 1000).toISOString();
  assert.equal((await api('PUT', `/api/admin/students/${student._id}/routes`, {
    token: admin, body: { registeredRoutes: [], accessValidUntil: past }
  })).status, 200);
  assert.equal((await api('GET', '/api/student/IMP2/authorized-buses', { token })).status, 401);
  const blocked = await api('POST', '/api/student/login', { body: { studentId: 'IMP2', password: 'secret2' } });
  assert.equal(blocked.status, 403);
  assert.match(blocked.data.error, /expired/);

  // clearing the date restores access
  assert.equal((await api('PUT', `/api/admin/students/${student._id}/routes`, {
    token: admin, body: { registeredRoutes: [], accessValidUntil: null }
  })).status, 200);
  assert.equal((await api('POST', '/api/student/login', { body: { studentId: 'IMP2', password: 'secret2' } })).status, 200);
});

/* ---------------- driver accounts + trip log ---------------- */
// (these run last: once a driver account exists, the shared password stops working)

const Trip = require('../models/Trip');
const todayRange = () => {
  const from = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
};
const ping = (token, busNumber) => api('POST', `/api/driver/buses/${busNumber}/location`, {
  token, body: { latitude: 25.44, longitude: 81.84 }
});

test('the shared driver login records trips; Stop ends them', async () => {
  await Trip.deleteMany({});
  const shared = await login('driver', { password: 'driver-test' });
  assert.equal((await ping(shared, 'N1')).status, 200);
  assert.equal((await ping(shared, 'N1')).status, 200);

  let trips = await Trip.find({});
  assert.equal(trips.length, 1, 'repeated pings continue the same trip');
  assert.equal(trips[0].driverName, 'Shared driver login');
  assert.equal(trips[0].endedAt, null);

  await api('POST', '/api/driver/buses/N1/stop', { token: shared });
  trips = await Trip.find({});
  assert.ok(trips[0].endedAt);
  assert.equal(trips[0].endReason, 'stopped');
});

test('driver accounts: created by admin, then the shared password stops working', async () => {
  const admin = await login('admin', { username: 'admin', password: 'new-admin-pass' });
  const sharedToken = await login('driver', { password: 'driver-test' });

  assert.equal((await api('POST', '/api/admin/drivers', {
    token: admin, body: { name: 'Bad', username: 'a b', password: 'secret1' }
  })).status, 400);
  const created = await api('POST', '/api/admin/drivers', {
    token: admin, body: { name: 'Ramesh', username: 'Ramesh', password: 'ramesh1' }
  });
  assert.equal(created.status, 200);
  assert.equal(created.data.username, 'ramesh');
  assert.equal((await api('POST', '/api/admin/drivers', {
    token: admin, body: { name: 'Again', username: 'ramesh', password: 'ramesh1' }
  })).status, 409);
  await api('POST', '/api/admin/drivers', { token: admin, body: { name: 'Suresh', username: 'suresh', password: 'suresh1' } });

  // shared login and tokens from it no longer work
  assert.equal((await api('POST', '/api/driver/login', { body: { password: 'driver-test' } })).status, 401);
  assert.equal((await ping(sharedToken, 'N1')).status, 401);

  const res = await api('POST', '/api/driver/login', { body: { username: 'RAMESH', password: 'ramesh1' } });
  assert.equal(res.status, 200);
  assert.equal(res.data.name, 'Ramesh');
});

test('trips record the driver, end on driver change, admin switch-off and timeout', async () => {
  await Trip.deleteMany({});
  const admin = await login('admin', { username: 'admin', password: 'new-admin-pass' });
  const ramesh = await login('driver', { username: 'ramesh', password: 'ramesh1' });
  const suresh = await login('driver', { username: 'suresh', password: 'suresh1' });

  await ping(ramesh, 'N1');
  await ping(suresh, 'N1');   // another driver takes the bus
  let trips = await Trip.find({}).sort({ startedAt: 1 });
  assert.deepEqual(trips.map((t) => [t.driverName, t.endReason]), [['Ramesh', 'driverChange'], ['Suresh', null]]);

  // admin switches the bus off
  const bus = await Bus.findOne({ busNumber: 'N1' });
  await api('PUT', `/api/admin/buses/${bus._id}`, { token: admin, body: { status: 'inactive' } });
  assert.equal((await Trip.findOne({ driverName: 'Suresh' })).endReason, 'admin');

  // no GPS for over 30 minutes: the next ping starts a fresh trip
  await ping(ramesh, 'N1');
  await Trip.updateOne({ endedAt: null }, { lastSeenAt: new Date(Date.now() - 31 * 60 * 1000) });
  await ping(ramesh, 'N1');
  trips = await Trip.find({ driverName: 'Ramesh' }).sort({ startedAt: 1 });
  assert.deepEqual(trips.map((t) => t.endReason), ['driverChange', 'timeout', null]);

  const list = await api('GET', `/api/admin/trips?${todayRange()}`, { token: admin });
  assert.equal(list.status, 200);
  assert.equal(list.data.length, 4);
  assert.equal((await api('GET', '/api/admin/trips?from=x&to=y', { token: admin })).status, 400);
  assert.equal((await api('GET', `/api/admin/trips?${todayRange()}`, { token: ramesh })).status, 403);
});

test('disabling a driver or resetting their password ends their logins', async () => {
  const admin = await login('admin', { username: 'admin', password: 'new-admin-pass' });
  const drivers = (await api('GET', '/api/admin/drivers', { token: admin })).data;
  const suresh = drivers.find((d) => d.username === 'suresh');
  const ramesh = drivers.find((d) => d.username === 'ramesh');

  const sureshToken = await login('driver', { username: 'suresh', password: 'suresh1' });
  await api('PUT', `/api/admin/drivers/${suresh.id}`, { token: admin, body: { active: false } });
  assert.equal((await ping(sureshToken, 'N1')).status, 401);
  assert.equal((await api('POST', '/api/driver/login', { body: { username: 'suresh', password: 'suresh1' } })).status, 401);

  const rameshToken = await login('driver', { username: 'ramesh', password: 'ramesh1' });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal((await api('PUT', `/api/admin/drivers/${ramesh.id}/password`, {
    token: admin, body: { newPassword: 'ramesh2' }
  })).status, 200);
  assert.equal((await ping(rameshToken, 'N1')).status, 401);
  assert.equal((await api('POST', '/api/driver/login', { body: { username: 'ramesh', password: 'ramesh2' } })).status, 200);
});

/* ---------------- input hardening ---------------- */

test('logins reject query objects instead of text', async () => {
  const attempts = [
    ['/api/student/login', { studentId: { $ne: null }, password: 'x' }],
    ['/api/student/login', { studentId: 'S001', password: { $ne: null } }],
    ['/api/admin/login', { username: { $gt: '' }, password: 'x' }],
    ['/api/driver/login', { username: { $ne: null }, password: 'x' }]
  ];
  for (const [path, body] of attempts) {
    const res = await api('POST', path, { body });
    assert.equal(res.status, 401, `${path} ${JSON.stringify(body)}`);
  }
});
