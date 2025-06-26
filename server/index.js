const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const masaRoutes = require('./routes/masalar');
const menuRoutes = require('./routes/menu');
const siparisRoutes = require('./routes/siparisler');
const qrRoutes = require('./routes/qr');

// Database
const { initDatabase } = require('./database/init');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(limiter);

// CORS ayarları
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'kafe-qr-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files for PWA
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/masalar', masaRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/siparisler', siparisRoutes);
app.use('/api/qrcode', qrRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin odaya katıldı');
  });

  socket.on('disconnect', () => {
    console.log('Bağlantı kesildi:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Bir şeyler ters gitti!' });
});

const PORT = process.env.PORT || 5002;

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📱 Admin Panel: http://localhost:${PORT}`);
    console.log(`🔗 QR Menü: http://localhost:${PORT}/menu`);
  });
}).catch(err => {
  console.error('Database başlatma hatası:', err);
  process.exit(1);
}); 