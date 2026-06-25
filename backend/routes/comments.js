const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// تمام مسیرها نیاز به احراز هویت دارند
router.use(protect);

// ایجاد کامنت جدید
router.post('/', commentController.createComment);

// دریافت کامنت‌های یک محتوا
router.get('/content/:contentId', commentController.getCommentsByContent);

// ویرایش کامنت
router.put('/:id', commentController.updateComment);

// حذف کامنت
router.delete('/:id', commentController.deleteComment);

// لایک کردن کامنت
router.post('/:id/like', commentController.likeComment);

module.exports = router; // ✅ مهم