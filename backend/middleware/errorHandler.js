/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error برای debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // خطاهای Validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'خطا در اعتبارسنجی داده‌ها',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // خطاهای JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'توکن منقضی شده است'
    });
  }

  // خطاهای دیتابیس
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'این رکورد قبلاً ثبت شده است'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'رکورد مرتبط یافت نشد'
    });
  }

  // خطای 404
  if (err.statusCode === 404 || err.status === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || 'منبع مورد نظر یافت نشد'
    });
  }

  // خطای 403
  if (err.statusCode === 403 || err.status === 403) {
    return res.status(403).json({
      success: false,
      message: err.message || 'دسترسی ممنوع'
    });
  }

  // خطای 401
  if (err.statusCode === 401 || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: err.message || 'دسترسی غیرمجاز'
    });
  }

  // خطای عمومی
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'خطای سرور';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
};

/**
 * Middleware برای مدیریت route های یافت نشده (404)
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`مسیر ${req.originalUrl} یافت نشد`);
  error.statusCode = 404;
  next(error);
};

/**
 * Helper function برای ایجاد خطای سفارشی
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper برای جلوگیری از try-catch در هر controller
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  asyncHandler
};
