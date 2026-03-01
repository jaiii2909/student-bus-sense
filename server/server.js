  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const http = require('http');
  const socketIo = require('socket.io');
  require("dotenv").config();

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

// helper endpoints for lookup (optional)
// e.g. list all buses or routes
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await require('./models/Bus').find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


  // Real-time updates via Socket.io

  io.on('connection', (socket) => {
    console.log('Client connected');
    // Real-time updates are now emitted when location is updated
  });

  mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected")).catch(err => console.error("DB error:", err));

  const PORT = process.env.PORT || 5000;
  server.listen(PORT,"0.0.0.0" ,() => console.log(`Server on http://localhost:${PORT}`));