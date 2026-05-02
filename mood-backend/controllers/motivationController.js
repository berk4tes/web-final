// motivationController — real XP leaderboard and daily motivation progress
const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const Recommendation = require('../models/Recommendation');
const Favorite = require('../models/Favorite');
const asyncHandler = require('../utils/asyncHandler');

const DAILY_TASKS = {
  checkin: { xp: 50 },
  seasonalWatch: { xp: 80 },
  seasonalListen: { xp: 60 },
  seasonalRead: { xp: 70 },
  emotionNote: { xp: 60 },
  save: { xp: 40 },
};

const localDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const asId = (value) => String(value || '');

const getCountMap = async (Model, dateField = 'createdAt') => {
  const rows = await Model.aggregate([
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 },
        latestAt: { $max: `$${dateField}` },
      },
    },
  ]);

  return new Map(rows.map((row) => [asId(row._id), row]));
};

const mapTasksByDay = (tasksByDay) => {
  if (!tasksByDay) return {};
  if (tasksByDay instanceof Map) return Object.fromEntries(tasksByDay.entries());
  return tasksByDay;
};

const computeRows = async (currentUserId) => {
  const [users, moodCounts, recommendationCounts, favoriteCounts] = await Promise.all([
    User.find({}).select('_id username avatar motivation createdAt').lean(),
    getCountMap(MoodLog, 'loggedAt'),
    getCountMap(Recommendation, 'createdAt'),
    getCountMap(Favorite, 'savedAt'),
  ]);

  const rows = users.map((user) => {
    const id = asId(user._id);
    const moods = moodCounts.get(id)?.count || 0;
    const recommendations = recommendationCounts.get(id)?.count || 0;
    const favorites = favoriteCounts.get(id)?.count || 0;
    const motivationXp = user.motivation?.xp || 0;
    const xp = motivationXp + moods * 50 + Math.min(recommendations * 8, 520) + favorites * 40;

    return {
      userId: id,
      username: user.username,
      avatar: user.avatar || '',
      xp,
      motivationXp,
      moods,
      recommendations,
      favorites,
      self: id === asId(currentUserId),
    };
  }).sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username));

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

const getMoodChat = async () => {
  const logs = await MoodLog.find({})
    .sort({ loggedAt: -1 })
    .limit(12)
    .populate('userId', 'username avatar')
    .lean();

  if (!logs.length) return [];

  const recommendations = await Recommendation.find({
    moodLogId: { $in: logs.map((log) => log._id) },
  })
    .sort({ createdAt: -1 })
    .lean();

  const recommendationByMoodLog = new Map();
  recommendations.forEach((item) => {
    const key = asId(item.moodLogId);
    if (!recommendationByMoodLog.has(key)) recommendationByMoodLog.set(key, item);
  });

  return logs.map((log) => {
    const recommendation = recommendationByMoodLog.get(asId(log._id));
    return {
      id: asId(log._id),
      username: log.userId?.username || 'Someone',
      avatar: log.userId?.avatar || '',
      moodLabel: log.moodLabel,
      moodText: log.moodText || '',
      intensity: log.intensity,
      title: recommendation?.title || '',
      contentType: recommendation?.contentType || '',
      createdAt: log.loggedAt,
    };
  });
};

exports.getSummary = asyncHandler(async (req, res) => {
  const today = localDateKey();
  const [leaderboard, moodChat, currentUser] = await Promise.all([
    computeRows(req.user._id),
    getMoodChat(),
    User.findById(req.user._id).select('motivation').lean(),
  ]);

  const taskLog = mapTasksByDay(currentUser?.motivation?.tasksByDay);
  const currentRow = leaderboard.find((row) => row.self) || null;

  return res.json({
    success: true,
    data: {
      leaderboard,
      moodChat,
      currentUser: {
        ...(currentRow || {}),
        tasksToday: taskLog[today] || [],
        taskLog,
        springReviews: currentUser?.motivation?.springReviews || [],
      },
    },
  });
});

exports.saveSpringReview = asyncHandler(async (req, res) => {
  const seasonKey = String(req.body?.seasonKey || 'spring').trim();
  const shelf = String(req.body?.shelf || '').trim();
  const contentType = String(req.body?.contentType || '').trim();
  const title = String(req.body?.title || '').trim().slice(0, 160);
  const emotion = String(req.body?.emotion || '').trim();
  const rating = Number(req.body?.rating);
  const allowedShelves = new Set(['movies', 'reads', 'music']);
  const allowedTypes = new Set(['movie', 'series', 'book', 'music']);
  const allowedEmotions = new Set(['bright', 'calm', 'romantic', 'nostalgic', 'energized']);

  if (!allowedShelves.has(shelf) || !allowedTypes.has(contentType) || !title || !allowedEmotions.has(emotion) || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(422).json({ success: false, message: 'Invalid spring review payload' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!user.motivation) {
    user.motivation = { xp: 0, tasksByDay: new Map(), joinedAt: new Date(), springReviews: [] };
  }

  const reviews = user.motivation.springReviews || [];
  const existingIndex = reviews.findIndex((item) => (
    item.seasonKey === seasonKey &&
    item.shelf === shelf &&
    item.title?.toLowerCase() === title.toLowerCase()
  ));
  const review = {
    seasonKey,
    shelf,
    contentType,
    title,
    rating: Math.round(rating),
    emotion,
    reviewedAt: new Date(),
  };

  if (existingIndex >= 0) {
    const previous = typeof reviews[existingIndex].toObject === 'function'
      ? reviews[existingIndex].toObject()
      : reviews[existingIndex];
    reviews[existingIndex] = { ...previous, ...review };
  } else {
    reviews.unshift(review);
  }

  user.motivation.springReviews = reviews.slice(0, 80);
  user.markModified('motivation');
  await user.save();

  return res.json({
    success: true,
    data: {
      review,
      springReviews: user.motivation.springReviews,
    },
  });
});

exports.awardTask = asyncHandler(async (req, res) => {
  const taskId = String(req.body?.taskId || '');
  const task = DAILY_TASKS[taskId];

  if (!task) {
    return res.status(422).json({ success: false, message: 'Invalid task id' });
  }

  const today = localDateKey();
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!user.motivation) {
    user.motivation = { xp: 0, tasksByDay: new Map(), joinedAt: new Date() };
  }

  const tasksByDay = user.motivation.tasksByDay || new Map();
  const completed = tasksByDay.get(today) || [];
  const alreadyCompleted = completed.includes(taskId);

  if (!alreadyCompleted) {
    tasksByDay.set(today, [...completed, taskId]);
    user.motivation.xp = (user.motivation.xp || 0) + task.xp;
    user.motivation.tasksByDay = tasksByDay;
    user.markModified('motivation');
    await user.save();
  }

  const leaderboard = await computeRows(req.user._id);
  const currentRow = leaderboard.find((row) => row.self);
  const freshTasks = user.motivation.tasksByDay.get(today) || [];

  return res.json({
    success: true,
    data: {
      awarded: !alreadyCompleted,
      xpAwarded: alreadyCompleted ? 0 : task.xp,
      currentUser: {
        ...(currentRow || {}),
        tasksToday: freshTasks,
      },
      leaderboard,
    },
  });
});
