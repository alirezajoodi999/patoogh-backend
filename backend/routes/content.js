// backend/routes/content.js
// ──────────────────────────────────────────────────────────────────────────────
// این فایل جایگزین routes/content.js اصلی می‌شود
// تغییرات: اضافه شدن مسیرهای favorites و saved
// ──────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const favoritesController = require('../controllers/favoritesController');
const fileUploadService = require('../services/fileUploadService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin, isContentManager } = require('../middleware/roleMiddleware');
const { contentValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// ============================================
// مسیرهای عمومی (نیاز به احراز هویت ندارند)
// ============================================

/**
 * @route   GET /api/content
 * @desc    دریافت لیست محتواها با فیلتر و صفحه‌بندی
 * @access  Public
 */
router.get('/', paginationValidation, contentController.getAllContent);

/**
 * @route   GET /api/content/search
 * @desc    جستجو در محتواها
 * @access  Public
 */
router.get('/search', paginationValidation, contentController.searchContent);

/**
 * @route   GET /api/content/competency/:competencyId
 * @desc    دریافت محتواهای مرتبط با یک شایستگی
 * @access  Public
 */
router.get('/competency/:competencyId', paginationValidation, contentController.getContentByCompetency);

// ============================================
// مسیرهای خصوصی: علاقه‌مندی‌ها (نیاز به لاگین)
// ============================================

/**
 * @route   GET /api/content/favorites
 * @desc    دریافت لیست علاقه‌مندی‌های کاربر
 * @access  Private
 */
router.get('/favorites', authenticateToken, favoritesController.getFavorites);

// ============================================
// مسیرهای خصوصی: ذخیره‌شده‌ها (نیاز به لاگین)
// ============================================

/**
 * @route   GET /api/content/saved
 * @desc    دریافت لیست ذخیره‌شده‌های کاربر
 * @access  Private
 */
router.get('/saved', authenticateToken, favoritesController.getSavedItems);

// ============================================
// دریافت جزئیات یک محتوا (مسیر :id باید بعد از مسیرهای ثابت باشد)
// ============================================

/**
 * @route   GET /api/content/:id
 * @desc    دریافت جزئیات یک محتوا
 * @access  Public
 */
router.get('/:id', idParamValidation, contentController.getContentById);

// ============================================
// مسیرهای خصوصی: عملیات روی یک محتوای خاص
// ============================================

/**
 * @route   POST /api/content/:id/favorite
 * @desc    افزودن به علاقه‌مندی‌ها
 * @access  Private
 */
router.post('/:id/favorite', authenticateToken, favoritesController.addFavorite);

/**
 * @route   DELETE /api/content/:id/favorite
 * @desc    حذف از علاقه‌مندی‌ها
 * @access  Private
 */
router.delete('/:id/favorite', authenticateToken, favoritesController.removeFavorite);

/**
 * @route   POST /api/content/:id/save
 * @desc    ذخیره کردن محتوا (بوک‌مارک)
 * @access  Private
 */
router.post('/:id/save', authenticateToken, favoritesController.saveItem);

/**
 * @route   DELETE /api/content/:id/save
 * @desc    حذف از ذخیره‌شده‌ها
 * @access  Private
 */
router.delete('/:id/save', authenticateToken, favoritesController.removeSavedItem);

// ============================================
// مسیرهای محافظت شده: ایجاد/ویرایش/حذف محتوا
// ============================================

/**
 * @route   POST /api/content
 * @desc    ایجاد محتوای جدید (فقط ادمین و مدیر محتوا)
 * @access  Private (Admin, Content Manager)
 */
router.post(
  '/',
  authenticateToken,
  isContentManager,
  fileUploadService.uploadSingle('file'),
  contentValidation,
  contentController.createContent
);

/**
 * @route   PUT /api/content/:id
 * @desc    ویرایش محتوا
 * @access  Private (Admin, Content Manager)
 */
router.put(
  '/:id',
  authenticateToken,
  isContentManager,
  idParamValidation,
  fileUploadService.uploadSingle('file'),
  contentValidation,
  contentController.updateContent
);

/**
 * @route   DELETE /api/content/:id
 * @desc    حذف محتوا (فقط ادمین)
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  idParamValidation,
  contentController.deleteContent
);

module.exports = router;
