const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
// always read server/.env, even when started from the project root
require("dotenv").config({ path: path.join(__dirname, '.env') });

const { verifyToken, requireRole } = require('./middleware/auth');
const { sendError } = require('./utils/errors');
const Bus = require('./models/Bus');
const Student = require('./models/Student');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
// make io accessible to controllers via request object
app.locals.io = io;

app.use(cors());
app.use(express.json());

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
      (student ? student.registeredRoutes : []).forEach((route) => socket.join(`route:${route}`));
    }
  } catch (err) {
    console.error('Socket join error:', err);
  }
});

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected")).catch(err => console.error("DB error:", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server on http://localhost:${PORT}`));
