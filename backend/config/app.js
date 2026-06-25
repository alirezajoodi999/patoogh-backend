const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

/**
 * تنظیمات اصلی Express Application
 */
const configureApp = () => {
  const app = express();

  // ====================
  // Security Middleware
  // ====================
  
  // Helmet برای امنیت headerها
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // ====================
  // CORS Configuration
  // ====================
  
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:4200', 'http://localhost:3000'];
      
      // اجازه به requestهای بدون origin (مثل mobile apps یا postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('دسترسی از این origin مجاز نیست'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));

  // ====================
  // Rate Limiting
  // ====================
  
  // محدودیت عمومی برای همه APIها
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقیقه
    max: 100, // حداکثر 100 درخواست در هر 15 دقیقه
    message: {
      success: false,
      message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // محدودیت سخت‌گیرانه‌تر برای authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقیقه
    max: 5, // حداکثر 5 تلاش ناموفق
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً 15 دقیقه صبر کنید.'
    }
  });

  // اعمال rate limiter به مسیرهای API
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  app.use(`${apiPrefix}/`, generalLimiter);
  app.use(`${apiPrefix}/auth/login`, authLimiter);
  app.use(`${apiPrefix}/auth/register`, authLimiter);

  // ====================
  // Body Parsing
  // ====================
  
  app.use(express.json({ 
    limit: process.env.JSON_LIMIT || '10mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          success: false,
          message: 'فرمت JSON نامعتبر است'
        });
        throw new Error('Invalid JSON');
      }
    }
  }));

  app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.URL_LIMIT || '10mb' 
  }));

  // ====================
  // Compression
  // ====================
  
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6
  }));

  // ====================
  // Logging
  // ====================
  
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else if (process.env.NODE_ENV === 'production') {
    // در production از فرمت combined استفاده می‌کنیم
    app.use(morgan('combined', {
      skip: (req, res) => res.statusCode < 400 // فقط خطاها را log کن
    }));
  }

  // ====================
  // Static Files
  // ====================
  
  const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
  }));

  // ====================
  // Request Metadata
  // ====================
  
  // اضافه کردن timestamp و request ID به هر request
  app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });

  // ====================
  // Health Check
  // ====================
  
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'سرور به درستی در حال اجرا است',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    });
  });

  // ====================
  // API Info
  // ====================
  
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'به API سیستم پاتوق خوش آمدید',
      version: process.env.APP_VERSION || '1.0.0',
      documentation: `${req.protocol}://${req.get('host')}/api-docs`,
      endpoints: {
        health: '/health',
        api: apiPrefix
      }
    });
  });

  return app;
};

/**
 * تنظیمات عمومی Application
 */
const appConfig = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  
  // API
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  
  // File Upload
  uploadsPath: process.env.UPLOADS_PATH || path.join(__dirname, '../uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Pagination
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  
  // Cache
  cacheEnabled: process.env.CACHE_ENABLED === 'true',
  cacheTTL: parseInt(process.env.CACHE_TTL, 10) || 3600, // 1 hour
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Security
  trustProxy: process.env.TRUST_PROXY === 'true',
  
  // Features
  features: {
    notifications: process.env.FEATURE_NOTIFICATIONS !== 'false',
    reminders: process.env.FEATURE_REMINDERS !== 'false',
    suggestions: process.env.FEATURE_SUGGESTIONS !== 'false',
    analytics: process.env.FEATURE_ANALYTICS !== 'false',
  }
};

/**
 * Validation برای تنظیمات ضروری
 */
const validateConfig = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `متغیرهای محیطی ضروری یافت نشدند: ${missingVars.join(', ')}`
    );
  }

  if (missingVars.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️  هشدار: متغیرهای محیطی زیر تنظیم نشده‌اند: ${missingVars.join(', ')}`
    );
  }
};

module.exports = {
  configureApp,
  appConfig,
  validateConfig
};
