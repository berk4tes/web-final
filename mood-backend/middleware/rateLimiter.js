// Rate limiters scoped per route family
const rateLimit = require('express-rate-limit');

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
};

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
});

const recommendationLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000,
  max: isDev ? 120 : 20,
});

const generalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: isDev ? 600 : 100,
});

module.exports = { authLimiter, recommendationLimiter, generalLimiter };
