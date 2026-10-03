const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require('./config');
const db = require('./db');
const { setupCorridorEngine } = require('./socket/corridorEngine');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const tripRoutes = require('./routes/tripRoutes');
const boardRoutes = require('./routes/boardRoutes');
const routeRoutes = require('./routes/routeRoutes');
const locationRoutes = require('./routes/locationRoutes');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.set('io', io);

// Express Middleware
app.use(cors({
  origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development)
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/location', locationRoutes);

// Standard Production Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'CorridorX Dynamic Emergency Mobility API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    metrics: {
      activeAmbulances: db.ambulances.find().length,
      hospitalsOnline: db.hospitals.find().length,
      activeTrips: db.trips.find(t => t.status !== 'COMPLETED').length,
      digitalBoardsSync: db.digitalBoards.find().length
    }
  });
});

// Initialize Real-time Socket.IO Engine
setupCorridorEngine(io);

// Start HTTP & WebSocket Server
server.listen(config.port, () => {
  console.log('========================================================');
  console.log(`🚑 CorridorX Emergency Backend running on port ${config.port}`);
  console.log(`📡 WebSocket Engine active for real-time telemetry`);
  console.log(`🌐 CORS enabled for: ${config.clientOrigin}`);
  console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
  console.log('========================================================');
});

module.exports = { app, server, io };
