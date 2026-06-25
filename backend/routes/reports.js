const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

// گزارش پیشرفت فردی (اختیاری userId برای ادمین)
router.get('/user-progress/:userId?', reportController.getUserProgressReport);

// بینش سازمانی (فقط ادمین)
router.get('/organizational-insights', reportController.getOrganizationalInsights);

// گزارش اثربخشی محتوا
router.get('/content-effectiveness/:contentId', reportController.getContentEffectiveness);

module.exports = router; // ✅ مهم