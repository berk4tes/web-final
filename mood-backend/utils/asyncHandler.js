// asyncHandler — wraps async controllers so thrown errors flow into errorHandler middleware
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
