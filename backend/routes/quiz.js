const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.use(protect);

// ایجاد آزمون برای یک محتوا (فقط ادمین)
router.post('/', quizController.createQuiz);

// دریافت آزمون یک محتوا
router.get('/content/:contentId', quizController.getQuiz);

// ارسال پاسخ‌های آزمون
router.post('/content/:contentId/submit', quizController.submitQuiz);

module.exports = router; // ✅ مهم