// Express app — wires middleware, routes, and error handling
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const moodRoutes = require('./routes/moodRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const statsRoutes = require('./routes/statsRoutes');
const motivationRoutes = require('./routes/motivationRoutes');
const moodboardRoutes = require('./routes/moodboardRoutes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
      ];
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/motivation', motivationRoutes);
app.use('/api/moodboard', moodboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

app.use(errorHandler);

module.exports = app;
