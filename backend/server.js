require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes قدیمی
const authRoutes = require('./routes/auth');
const competencyRoutes = require('./routes/competencies');
const contentRoutes = require('./routes/content');
const evaluationRoutes = require('./routes/evaluations');
const progressRoutes = require('./routes/progress');
const reminderRoutes = require('./routes/reminders');
const suggestionRoutes = require('./routes/suggestions');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const mediaTypeRoutes = require('./routes/mediaTypeRoutes');
const contentSourceRoutes = require('./routes/contentSourceRoutes');

// Import routes جدید (کامنت شده برای دیباگ)
// const commentRoutes = require('./routes/comments');
// const recommendationRoutes = require('./routes/recommendations');
// const reportRoutes = require('./routes/reports');
// const quizRoutes = require('./routes/quiz');
// const savedContentRoutes = require('./routes/saved-content');

const app = express();

// ====================
// Security Middleware
// ====================

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
  maxAge: 86400,
};

app.use(cors(corsOptions));

// ====================
// Body Parsing
// ====================

app.use(express.json({ 
  limit: '10mb',
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
  limit: '10mb' 
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
} else {
  app.use(morgan('combined', { 
    stream: logger.stream,
    skip: (req, res) => res.statusCode < 400
  }));
}

// ====================
// Static Files
// ====================

const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

// ====================
// Request Metadata
// ====================

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ====================
// Rate Limiting
// ====================

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'درخواست‌های زیادی از این IP ارسال شده است. لطفاً بعداً تلاش کنید.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً 15 دقیقه صبر کنید.'
  }
});

// ====================
// Health Check
// ====================

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    const [result] = await sequelize.query('SELECT NOW() as now, version() as version');
    
    res.status(200).json({ 
      success: true,
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      database: {
        sequelize: 'connected',
        serverTime: result[0]?.now || 'unknown',
        version: result[0]?.version?.split(' ')[0] || 'unknown'
      },
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
      }
    });
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// ====================
// Root Endpoint
// ====================

const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'به API سیستم پاتوق خوش آمدید',
    version: process.env.APP_VERSION || '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    endpoints: {
      health: '/health',
      api: API_PREFIX,
      routes: {
        auth: `${API_PREFIX}/auth`,
        competencies: `${API_PREFIX}/competencies`,
        content: `${API_PREFIX}/content`,
        evaluations: `${API_PREFIX}/evaluations`,
        progress: `${API_PREFIX}/progress`,
        reminders: `${API_PREFIX}/reminders`,
        suggestions: `${API_PREFIX}/suggestions`,
        notifications: `${API_PREFIX}/notifications`,
        admin: `${API_PREFIX}/admin`,
        mediaTypes: `${API_PREFIX}/media-types`,
        contentSources: `${API_PREFIX}/content-sources`
      }
    }
  });
});

// ====================
// API Routes
// ====================

app.use(API_PREFIX, generalLimiter);

// ثبت routeهای قدیمی
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/competencies`, competencyRoutes);
app.use(`${API_PREFIX}/content`, contentRoutes);
app.use(`${API_PREFIX}/evaluations`, evaluationRoutes);
app.use(`${API_PREFIX}/progress`, progressRoutes);
app.use(`${API_PREFIX}/reminders`, reminderRoutes);
app.use(`${API_PREFIX}/suggestions`, suggestionRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/media-types`, mediaTypeRoutes);
app.use(`${API_PREFIX}/content-sources`, contentSourceRoutes);

// ثبت routeهای جدید (همگی کامنت شده‌اند)
// app.use(`${API_PREFIX}/comments`, commentRoutes);
// app.use(`${API_PREFIX}/recommendations`, recommendationRoutes);
// app.use(`${API_PREFIX}/reports`, reportRoutes);
// app.use(`${API_PREFIX}/quiz`, quizRoutes);
// app.use(`${API_PREFIX}/saved-content`, savedContentRoutes);

// ====================
// 404 Handler
// ====================

app.use(notFoundHandler);

// ====================
// Global Error Handler
// ====================

app.use(errorHandler);

// ====================
// Server Configuration
// ====================

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ====================
// Database & Server Start
// ====================

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ اتصال Sequelize به دیتابیس برقرار شد');

    const [result] = await sequelize.query('SELECT NOW() as now');
    logger.info('✅ اتصال به دیتابیس برقرار شد:', result[0].now);

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: true });
      logger.info('✅ مدل‌های دیتابیس همگام‌سازی شدند');
    }

    const server = app.listen(PORT, HOST, () => {
      logger.info('='.repeat(50));
      logger.info('🚀 سرور با موفقیت راه‌اندازی شد');
      logger.info(`📍 آدرس: http://${HOST}:${PORT}`);
      logger.info(`🌍 محیط: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📡 API Prefix: ${API_PREFIX}`);
      logger.info('='.repeat(50));
      logger.info('📋 مسیرهای فعال:');
      logger.info(`   - Auth: ${API_PREFIX}/auth`);
      logger.info(`   - Competencies: ${API_PREFIX}/competencies`);
      logger.info(`   - Content: ${API_PREFIX}/content`);
      logger.info(`   - Evaluations: ${API_PREFIX}/evaluations`);
      logger.info(`   - Progress: ${API_PREFIX}/progress`);
      logger.info(`   - Reminders: ${API_PREFIX}/reminders`);
      logger.info(`   - Suggestions: ${API_PREFIX}/suggestions`);
      logger.info(`   - Notifications: ${API_PREFIX}/notifications`);
      logger.info(`   - Admin: ${API_PREFIX}/admin`);
      logger.info(`   - Media Types: ${API_PREFIX}/media-types`);
      logger.info(`   - Content Sources: ${API_PREFIX}/content-sources`);
      logger.info('='.repeat(50));
    });

    server.timeout = parseInt(process.env.SERVER_TIMEOUT) || 30000;

    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} دریافت شد. در حال خاموش کردن سرور...`);
      
      server.close(async () => {
        logger.info('✅ سرور HTTP بسته شد');
        
        try {
          await sequelize.close();
          logger.info('✅ اتصال Sequelize بسته شد');
          logger.info('👋 خداحافظ!');
          process.exit(0);
        } catch (error) {
          logger.error('❌ خطا در بستن اتصالات دیتابیس:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('❌ خاموش کردن سرور بیش از حد طول کشید. Force shutdown...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    if (process.env.ENABLE_SCHEDULED_TASKS === 'true') {
      const notificationService = require('./services/notificationService');
      
      setInterval(async () => {
        try {
          logger.info('🧹 شروع پاک‌سازی اعلان‌های منقضی شده...');
          const deleted = await notificationService.cleanupExpiredNotifications();
          logger.info(`✅ ${deleted} اعلان منقضی شده پاک‌سازی شد`);
        } catch (error) {
          logger.error('❌ خطا در پاک‌سازی اعلان‌های منقضی شده:', error);
        }
      }, 24 * 60 * 60 * 1000);

      setInterval(async () => {
        try {
          logger.info('🧹 شروع پاک‌سازی اعلان‌های قدیمی...');
          const deleted = await notificationService.cleanupOldNotifications(90);
          logger.info(`✅ ${deleted} اعلان قدیمی پاک‌سازی شد`);
        } catch (error) {
          logger.error('❌ خطا در پاک‌سازی اعلان‌های قدیمی:', error);
        }
      }, 7 * 24 * 60 * 60 * 1000);

      logger.info('⏰ Scheduled tasks فعال شدند');
    }

  } catch (error) {
    logger.error('❌ خطا در راه‌اندازی سرور:', error);
    logger.error('Stack:', error.stack);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Promise Rejection at:', promise);
  logger.error('❌ Reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    logger.error('⚠️ Server continues running in production mode');
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  logger.error('Stack:', error.stack);
  process.exit(1);
});

process.on('warning', (warning) => {
  logger.warn('⚠️ Warning:', warning.name);
  logger.warn('⚠️ Message:', warning.message);
  if (warning.stack) {
    logger.warn('⚠️ Stack:', warning.stack);
  }
});

startServer();

module.exports = app;