// utils/logger.js
const winston = require('winston');
const path = require('path');

// تعریف سطوح لاگ
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// رنگ‌بندی سطوح
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// فرمت لاگ
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// فرمت کنسول
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// تعیین سطح لاگ بر اساس محیط
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// تنظیمات transports
const transports = [
  // لاگ کنسول
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // لاگ خطاها در فایل
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // لاگ همه در فایل
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// ایجاد logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// متد کمکی برای لاگ درخواست‌های HTTP
logger.logRequest = (req, res, responseTime) => {
  logger.http(
    `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms - ${req.ip}`
  );
};

// متد کمکی برای لاگ خطاهای دیتابیس
logger.logDbError = (operation, error, context = {}) => {
  logger.error('Database Error', {
    operation,
    error: error.message,
    stack: error.stack,
    context,
  });
};

// متد کمکی برای لاگ خطاهای احراز هویت
logger.logAuthError = (userId, action, error) => {
  logger.warn('Authentication Error', {
    userId,
    action,
    error: error.message,
    timestamp: new Date().toISOString(),
  });
};

// متد کمکی برای لاگ فعالیت‌های کاربر
logger.logUserActivity = (userId, action, details = {}) => {
  logger.info('User Activity', {
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;
