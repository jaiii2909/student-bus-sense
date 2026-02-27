  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const http = require('http');
  const socketIo = require('socket.io');
  require("dotenv").config();

  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server, { cors: { origin: "*" } });

  app.use(cors());
  app.use(express.json());

  const Bus = require('./models/Bus');
  const Student = require('./models/Student');


  //API routes 

  app.get('/api/buses', async (req, res) => {
    try {
      const buses = await Bus.find();
      res.json(buses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/buses/:route', async (req, res) => {
    try {
      const buses = await Bus.find({ route: req.params.route });
      res.json(buses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Student login endpoint
  app.post('/api/login', async (req, res) => {
    const { studentId } = req.body;
    try {
      const student = await Student.findOne({ id: studentId });
      if (student) {
        res.json(student);
      } else {
        res.status(401).json({ error: 'Invalid student ID' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update bus location endpoint
  app.post('/api/buses/:busId/location', async (req, res) => {
    const { busId } = req.params;
    const { lat, lng } = req.body;
    try {
      // perform case‑insensitive lookup so frontend casing doesn't matter
      const bus = await Bus.findOneAndUpdate(
        { id: { $regex: new RegExp(`^${busId}$`, 'i') } },
        { coordinates: { lat, lng } },
        { new: true }
      );
      if (bus) {
        // Emit real-time update
        const activeBuses = await Bus.find({ status: 'active' });
        io.emit('busUpdates', activeBuses);
        res.json({ success: true, bus });
      } else {
        res.status(404).json({ error: 'Bus not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // Endpoint for driver stopping location sharing
app.post('/api/buses/:busId/stop', async (req, res) => {
  const { busId } = req.params;
  try {
    const bus = await Bus.findOneAndUpdate(
      { id: { $regex: new RegExp(`^${busId}$`, 'i') } },
      { sharing: false }, // new field to indicate driver stopped sharing
      { new: true }
    );

    if (bus) {
      // Emit all buses to students so frontend can update status
      const allBuses = await Bus.find();
      io.emit('busUpdates', allBuses);

      res.json({ success: true, bus });
    } else {
      res.status(404).json({ error: 'Bus not found' });
    }
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