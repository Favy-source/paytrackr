const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

// routes
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/auth.google');
const billsRoutes = require('./routes/bills');
const transactionsRoutes = require('./routes/transactions');
const incomeRoutes = require('./routes/income');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');

const app = express();
app.set('trust proxy', 1);

// DB
connectDB();

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS (allow prod + local/dev origins)
const allowed = [
  process.env.CLIENT_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:19006',
  'exp://localhost:19000',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`))),
  credentials: true,
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logs
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);     // << Google OAuth (POST /api/auth/google)
app.use('/api/bills', billsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'PayTrackr API is running!', timestamp: new Date().toISOString() });
});

// 404
app.use('*', (req, res) => res.status(404).json({ status: 'error', message: 'Route not found' }));

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') console.error(err);
  res.status(err.status || 500).json({ status: 'error', message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  const local = `http://localhost:${PORT}/api/health`;
  const publicUrl = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/health` : null;
  console.log(`🚀 PayTrackr API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health (local): ${local}`);
  if (publicUrl) console.log(`🔗 Health (public): ${publicUrl}`);
});

process.on('SIGTERM', () => server.close(() => {
  console.log('🛑 HTTP server closed');
  process.exit(0);
}));

module.exports = app;
