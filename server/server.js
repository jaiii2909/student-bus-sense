const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
// always read server/.env, even when started from the project root
require("dotenv").config({ path: path.join(__dirname, '.env') });

const { verifyToken, requireRole, isTokenOutdated } = require('./middleware/auth');
const { sendError } = require('./utils/errors');
const Bus = require('./models/Bus');
const Student = require('./models/Student');

// Allowed frontend origins, comma separated (e.g. https://your-app.vercel.app).
// When unset every origin is allowed, which is fine for local development.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  console.warn('CORS_ORIGINS is not set; any website can call this API.');
}
const corsOptions = { origin: allowedOrigins.length ? allowedOrigins : '*' };

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: corsOptions });
// make io accessible to controllers via request object
app.locals.io = io;

// Render sits behind one proxy; this gives the rate limiter the real client IP
app.set('trust proxy', 1);
app.use(cors(corsOptions));
// a little larger than the default so a CSV import of a few hundred students fits
app.use(express.json({ limit: '1mb' }));

// used by the frontend to wake the server and by uptime checks
app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

// routers for each user type
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const studentRoutes = require('./routes/studentRoutes');

// mount api prefixes
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);

// bus list used by the driver screen
app.get('/api/buses', requireRole('driver', 'admin'), async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    sendError(res, err);
  }
});

// Real-time updates via Socket.io.
// Clients send their token on connect; students only join rooms for their own routes.
io.on('connection', async (socket) => {
  const user = verifyToken(socket.handshake.auth && socket.handshake.auth.token);
  if (!user) return socket.disconnect(true);

  try {
    if (user.role === 'admin') {
      socket.join('admin');
    } else if (user.role === 'student') {
      const student = await Student.findOne({ studentId: user.studentId });
      if (!student || isTokenOutdated(user, student.passwordChangedAt) || student.isPassExpired()) {
        return socket.disconnect(true);
      }
      // 'students' receives announcements meant for every route
      socket.join('students');
      student.registeredRoutes.forEach((route) => socket.join(`route:${route}`));
    }
  } catch (err) {
    console.error('Socket join error:', err);
  }
});

// started directly (npm start); tests import the app instead
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected")).catch(err => console.error("DB error:", err));

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = { app, server, io };
