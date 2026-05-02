// User schema — stores credentials and basic profile info
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    motivation: {
      xp: {
        type: Number,
        default: 0,
        min: 0,
      },
      tasksByDay: {
        type: Map,
        of: [String],
        default: {},
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      springReviews: [
        {
          seasonKey: {
            type: String,
            default: 'spring',
          },
          shelf: {
            type: String,
            enum: ['movies', 'reads', 'music'],
          },
          contentType: {
            type: String,
            enum: ['movie', 'series', 'book', 'music'],
          },
          title: {
            type: String,
            trim: true,
            maxlength: 160,
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          emotion: {
            type: String,
            enum: ['bright', 'calm', 'romantic', 'nostalgic', 'energized'],
          },
          reviewedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
