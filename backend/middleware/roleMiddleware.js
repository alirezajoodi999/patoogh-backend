/**
 * Middleware برای کنترل دسترسی بر اساس نقش کاربر
 * 
 * نقش‌های سیستم پاتوق (بر اساس مستندات صفحه ۱۵):
 * ─────────────────────────────────────────────────
 * admin    → ادمین فنی: مدیریت کامل سیستم، کاربران، امنیت، زیرساخت
 * hr_admin → ادمین آموزش و توسعه: مدیریت محتوا، شایستگی‌ها، گزارش‌های تحلیلی
 * manager  → مدیران سازمان: مشاهده محتوا، ارزیابی، پروفایل شخصی
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'دسترسی غیرمجاز - لطفاً وارد شوید'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'دسترسی ممنوع - شما مجوز دسترسی به این بخش را ندارید',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'خطا در بررسی دسترسی',
        error: error.message
      });
    }
  };
};

/**
 * فقط ادمین فنی
 */
const isAdmin = (req, res, next) => {
  return checkRole('admin')(req, res, next);
};

/**
 * ادمین فنی یا ادمین آموزش و توسعه
 * (مدیریت محتوا، شایستگی‌ها، گزارش‌ها - صفحه ۱۶ مستندات)
 */
const isHRAdmin = (req, res, next) => {
  return checkRole('admin', 'hr_admin')(req, res, next);
};

/**
 * مدیریت محتوا: ادمین فنی یا ادمین آموزش و توسعه
 * (تعریف محتوا، اتصال به شایستگی‌ها، تعیین وزن - صفحه ۱۶)
 */
const isContentManager = (req, res, next) => {
  return checkRole('admin', 'hr_admin')(req, res, next);
};

/**
 * همه کاربران احراز هویت شده (مدیران سازمان و بالاتر)
 */
const isAuthenticated = (req, res, next) => {
  return checkRole('admin', 'hr_admin', 'manager')(req, res, next);
};

/**
 * بررسی دسترسی به پروفایل خودش یا ادمین
 */
const isSelfOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }

    const targetId = req.params.userId || req.params.id;
    
    if (req.user.role === 'admin' || req.user.id === targetId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'شما فقط می‌توانید به اطلاعات خود دسترسی داشته باشید'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بررسی دسترسی',
      error: error.message
    });
  }
};

module.exports = {
  checkRole,
  isAdmin,
  isHRAdmin,
  isContentManager,
  isAuthenticated,
  isSelfOrAdmin
};
