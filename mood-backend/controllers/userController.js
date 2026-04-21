// userController — update user profile (username/avatar)
const { validationResult } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  if (id !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const updates = {};
  if (typeof req.body.username === 'string') updates.username = req.body.username.trim();
  if (typeof req.body.avatar === 'string') updates.avatar = req.body.avatar.trim();

  if (updates.username) {
    const dup = await User.findOne({ username: updates.username, _id: { $ne: id } });
    if (dup) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }
  }

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    },
  });
});
