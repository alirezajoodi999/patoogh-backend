const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/auth');

/**
 * Middleware برای احراز هویت کاربر با JWT
 */
const authenticateToken = (req, res, next) => {
  try {
    // دریافت توکن از header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز - توکن یافت نشد'
      });
    }

    // تایید توکن
    jwt.verify(token, jwtConfig.secret, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'توکن منقضی شده است'
          });
        }
        return res.status(403).json({
          success: false,
          message: 'توکن نامعتبر است'
        });
      }

      // اضافه کردن اطلاعات کاربر به request
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطا در احراز هویت',
      error: error.message
    });
  }
};

/**
 * Middleware اختیاری برای احراز هویت (برای endpoint های عمومی که اطلاعات کاربر اختیاری است)
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, jwtConfig.secret, (err, user) => {
      if (err) {
        req.user = null;
      } else {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
