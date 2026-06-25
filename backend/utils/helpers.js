// utils/helpers.js
const crypto = require('crypto');
const path = require('path');

/**
 * تولید کد تصادفی
 */
const generateRandomCode = (length = 6) => {
  return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
};

/**
 * تولید توکن تصادفی
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * فرمت‌دهی تاریخ به شمسی
 */
const formatDateToPersian = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
};

/**
 * محاسبه تفاوت روزها
 */
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * صفحه‌بندی
 */
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset };
};

/**
 * ساخت پاسخ موفق
 */
const successResponse = (data, message = 'عملیات با موفقیت انجام شد', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta
  };
};

/**
 * ساخت پاسخ خطا
 */
const errorResponse = (message = 'خطایی رخ داده است', errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    statusCode
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
};

/**
 * حذف فیلدهای null و undefined
 */
const removeNullFields = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
};

/**
 * تبدیل رشته به slug
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * بررسی معتبر بودن فرمت فایل
 */
const isValidFileType = (filename, allowedTypes) => {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
};

/**
 * تبدیل بایت به واحد قابل خواندن
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * محاسبه درصد
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * گروه‌بندی آرایه بر اساس کلید
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * حذف تکراری‌ها از آرایه
 */
const uniqueArray = (array, key = null) => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * تاخیر (برای retry و throttling)
 */
const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * اعتبارسنجی کد ملی ایران
 */
const isValidNationalCode = (code) => {
  if (!code || code.length !== 10 || !/^\d{10}$/.test(code)) {
    return false;
  }
  
  const check = parseInt(code[9]);
  const sum = code.split('').slice(0, 9).reduce((acc, digit, index) => {
    return acc + parseInt(digit) * (10 - index);
  }, 0);
  
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};

/**
 * ماسک کردن ایمیل
 */
const maskEmail = (email) => {
  if (!email) return '';
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * ماسک کردن شماره تلفن
 */
const maskPhoneNumber = (phone) => {
  if (!phone) return '';
  
  return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1***$3');
};

/**
 * تبدیل ثانیه به فرمت قابل خواندن
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} ساعت`);
  if (minutes > 0) parts.push(`${minutes} دقیقه`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} ثانیه`);
  
  return parts.join(' و ');
};

/**
 * تولید رنج تاریخ
 */
const getDateRange = (type = 'week') => {
  const end = new Date();
  const start = new Date();
  
  switch (type) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  
  return { startDate: start, endDate: end };
};

/**
 * بررسی خالی بودن آبجکت
 */
const isEmpty = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * کپی عمیق آبجکت
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

module.exports = {
  generateRandomCode,
  generateToken,
  formatDateToPersian,
  getDaysDifference,
  paginate,
  successResponse,
  errorResponse,
  removeNullFields,
  slugify,
  isValidFileType,
  formatBytes,
  calculatePercentage,
  groupBy,
  uniqueArray,
  delay,
  isValidNationalCode,
  maskEmail,
  maskPhoneNumber,
  formatDuration,
  getDateRange,
  isEmpty,
  deepClone
};
