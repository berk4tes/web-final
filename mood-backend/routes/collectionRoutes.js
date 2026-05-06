// collectionRoutes — watched/read collection CRUD
const express = require('express');
const { body, query } = require('express-validator');
const auth = require('../middleware/auth');
const {
  addCollectionItem,
  getCollectionItems,
  removeCollectionItem,
} = require('../controllers/collectionController');

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('type').isIn(['watched', 'read']).withMessage('Invalid collection type'),
    body('contentType').isIn(['movie', 'series', 'book']).withMessage('Invalid content type'),
    body('externalId').isString().trim().isLength({ min: 1 }).withMessage('externalId required'),
    body('title').isString().trim().isLength({ min: 1, max: 300 }).withMessage('title required'),
    body('thumbnail').optional().isString().isLength({ max: 500 }),
  ],
  addCollectionItem
);

router.get(
  '/',
  auth,
  [
    query('type').optional().isIn(['watched', 'read']).withMessage('Invalid collection type'),
  ],
  getCollectionItems
);

router.delete('/:id', auth, removeCollectionItem);

module.exports = router;
