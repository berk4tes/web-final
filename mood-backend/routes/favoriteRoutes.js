// favoriteRoutes — bookmark CRUD
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  addFavorite,
  getFavorites,
  removeFavorite,
  checkFavorite,
  searchFavorites,
} = require('../controllers/favoriteController');

const CONTENT_TYPES = ['movie', 'series', 'music', 'book'];

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('contentType').isIn(CONTENT_TYPES).withMessage('Invalid content type'),
    body('externalId').isString().trim().isLength({ min: 1 }).withMessage('externalId required'),
    body('title').isString().trim().isLength({ min: 1, max: 300 }).withMessage('title required'),
    body('thumbnail').optional().isString().isLength({ max: 500 }),
  ],
  addFavorite
);

router.get('/', auth, getFavorites);
router.get('/search', auth, searchFavorites);
router.get('/check/:externalId', auth, checkFavorite);
router.delete('/:id', auth, removeFavorite);

module.exports = router;
