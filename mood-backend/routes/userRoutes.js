// userRoutes — profile updates
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { updateProfile } = require('../controllers/userController');

const router = express.Router();

router.patch(
  '/:id',
  auth,
  [
    body('username').optional().isString().trim().isLength({ min: 3, max: 30 }),
    body('avatar').optional().isString().isLength({ max: 500 }),
  ],
  updateProfile
);

module.exports = router;
