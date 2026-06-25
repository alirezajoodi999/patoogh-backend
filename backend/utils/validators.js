// utils/validators.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * بررسی نتایج اعتبارسنجی
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * اعتبارسنجی ایمیل
 */
const validateEmail = () => {
  return body('email')
    .trim()
    .isEmail()
    .withMessage('ایمیل معتبر نیست')
    .normalizeEmail();
};

/**
 * اعتبارسنجی رمز عبور
 */
const validatePassword = (field = 'password') => {
  return body(field)
    .isLength({ min: 8 })
    .withMessage('رمز عبور باید حداقل 8 کاراکتر باشد')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد');
};

/**
 * اعتبارسنجی شماره تلفن ایران
 */
const validatePhoneNumber = (field = 'phone_number') => {
  return body(field)
    .optional()
    .matches(/^09\d{9}$/)
    .withMessage('شماره تلفن معتبر نیست (فرمت: 09xxxxxxxxx)');
};

/**
 * اعتبارسنجی نقش کاربر
 */
const validateRole = () => {
  return body('role')
    .isIn(['admin', 'hr_admin', 'manager'])
    .withMessage('نقش کاربر معتبر نیست');
};

/**
 * اعتبارسنجی وضعیت
 */
const validateStatus = (field = 'status') => {
  return body(field)
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('وضعیت معتبر نیست');
};

/**
 * اعتبارسنجی ID
 */
const validateId = (field = 'id') => {
  return param(field)
    .isInt({ min: 1 })
    .withMessage('شناسه معتبر نیست');
};

/**
 * اعتبارسنجی تاریخ
 */
const validateDate = (field) => {
  return body(field)
    .optional()
    .isISO8601()
    .withMessage('فرمت تاریخ معتبر نیست (ISO 8601)');
};

/**
 * اعتبارسنجی بازه تاریخ
 */
const validateDateRange = () => {
  return [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ شروع معتبر نیست'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('تاریخ پایان معتبر نیست')
      .custom((endDate, { req }) => {
        if (req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
          throw new Error('تاریخ پایان باید بعد از تاریخ شروع باشد');
        }
        return true;
      })
  ];
};

/**
 * اعتبارسنجی امتیاز (1-5)
 */
const validateRating = () => {
  return body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('امتیاز باید بین 1 تا 5 باشد');
};

/**
 * اعتبارسنجی درصد پیشرفت
 */
const validateProgress = () => {
  return body('progress_percentage')
    .isInt({ min: 0, max: 100 })
    .withMessage('درصد پیشرفت باید بین 0 تا 100 باشد');
};

/**
 * اعتبارسنجی URL
 */
const validateUrl = (field) => {
  return body(field)
    .optional()
    .isURL()
    .withMessage('آدرس URL معتبر نیست');
};

/**
 * اعتبارسنجی وضعیت پیشرفت
 */
const validateProgressStatus = () => {
  return body('status')
    .isIn(['not_started', 'in_progress', 'completed'])
    .withMessage('وضعیت پیشرفت معتبر نیست');
};

/**
 * اعتبارسنجی نوع رسانه
 */
const validateMediaType = () => {
  return body('media_type_id')
    .isInt({ min: 1 })
    .withMessage('نوع رسانه معتبر نیست');
};

/**
 * اعتبارسنجی شایستگی
 */
const validateCompetency = () => {
  return body('competency_id')
    .isInt({ min: 1 })
    .withMessage('شایستگی معتبر نیست');
};

/**
 * اعتبارسنجی صفحه‌بندی
 */
const validatePagination = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('شماره صفحه باید عدد مثبت باشد'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('تعداد آیتم در صفحه باید بین 1 تا 100 باشد')
  ];
};

/**
 * اعتبارسنجی فیلد‌های متنی
 */
const validateTextField = (field, minLength = 1, maxLength = 500) => {
  return body(field)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`${field} باید بین ${minLength} تا ${maxLength} کاراکتر باشد`);
};

/**
 * اعتبارسنجی آرایه
 */
const validateArray = (field, minLength = 1) => {
  return body(field)
    .isArray({ min: minLength })
    .withMessage(`${field} باید آرایه‌ای با حداقل ${minLength} عنصر باشد`);
};

/**
 * اعتبارسنجی بولین
 */
const validateBoolean = (field) => {
  return body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} باید مقدار بولین باشد`);
};

module.exports = {
  validate,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateRole,
  validateStatus,
  validateId,
  validateDate,
  validateDateRange,
  validateRating,
  validateProgress,
  validateUrl,
  validateProgressStatus,
  validateMediaType,
  validateCompetency,
  validatePagination,
  validateTextField,
  validateArray,
  validateBoolean
};
