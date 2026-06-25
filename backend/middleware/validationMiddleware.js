const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware برای بررسی نتایج validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'خطا در اعتبارسنجی داده‌ها',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validation rules برای ثبت‌نام
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('نام کاربری فقط می‌تواند شامل حروف، اعداد و _ باشد'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('ایمیل معتبر نیست')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('رمز عبور باید حداقل 6 کاراکتر باشد'),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('نام کامل نباید بیشتر از 100 کاراکتر باشد'),
  
  validate
];

/**
 * Validation rules برای ورود
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('ایمیل الزامی است')
    .isEmail()
    .withMessage('ایمیل معتبر نیست')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
  
  validate
];

/**
 * Validation rules برای ایجاد/ویرایش محتوا
 */
const contentValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('عنوان باید بین 3 تا 200 کاراکتر باشد'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('توضیحات نباید بیشتر از 1000 کاراکتر باشد'),
  
  body('url')
    .trim()
    .isURL()
    .withMessage('آدرس URL معتبر نیست'),
  
  body('media_type_id')
    .isInt({ min: 1 })
    .withMessage('نوع رسانه معتبر نیست'),
  
  body('competency_id')
    .isInt({ min: 1 })
    .withMessage('شایستگی معتبر نیست'),
  
  body('source_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('منبع معتبر نیست'),
  
  body('duration_minutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('مدت زمان باید عدد مثبت باشد'),
  
  body('difficulty_level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('سطح دشواری باید یکی از مقادیر beginner, intermediate, advanced باشد'),
  
  validate
];

/**
 * Validation rules برای ارزیابی محتوا
 */
const evaluationValidation = [
  body('content_id')
    .isInt({ min: 1 })
    .withMessage('شناسه محتوا معتبر نیست'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('امتیاز باید بین 1 تا 5 باشد'),
  
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('نظر نباید بیشتر از 500 کاراکتر باشد'),
  
  validate
];

/**
 * Validation rules برای پیشرفت یادگیری
 */
const progressValidation = [
  body('content_id')
    .isInt({ min: 1 })
    .withMessage('شناسه محتوا معتبر نیست'),
  
  body('status')
    .isIn(['not_started', 'in_progress', 'completed'])
    .withMessage('وضعیت باید یکی از مقادیر not_started, in_progress, completed باشد'),
  
  body('progress_percentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('درصد پیشرفت باید بین 0 تا 100 باشد'),
  
  validate
];

/**
 * Validation rules برای یادآور
 */
const reminderValidation = [
  body('content_id')
    .isInt({ min: 1 })
    .withMessage('شناسه محتوا معتبر نیست'),
  
  body('reminder_date')
    .isISO8601()
    .withMessage('تاریخ یادآور معتبر نیست')
    .custom((value) => {
      const reminderDate = new Date(value);
      const now = new Date();
      if (reminderDate <= now) {
        throw new Error('تاریخ یادآور باید در آینده باشد');
      }
      return true;
    }),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('پیام نباید بیشتر از 200 کاراکتر باشد'),
  
  validate
];

/**
 * Validation rules برای پیشنهاد محتوا
 */
const suggestionValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('عنوان باید بین 3 تا 200 کاراکتر باشد'),
  
  body('url')
    .trim()
    .isURL()
    .withMessage('آدرس URL معتبر نیست'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('توضیحات نباید بیشتر از 500 کاراکتر باشد'),
  
  body('competency_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('شایستگی معتبر نیست'),
  
  validate
];

/**
 * Validation برای پارامترهای ID
 */
const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('شناسه معتبر نیست'),
  
  validate
];

/**
 * Validation برای query parameters صفحه‌بندی
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('شماره صفحه باید عدد مثبت باشد'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('تعداد آیتم در هر صفحه باید بین 1 تا 100 باشد'),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  contentValidation,
  evaluationValidation,
  progressValidation,
  reminderValidation,
  suggestionValidation,
  idParamValidation,
  paginationValidation
};
