// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// همه مسیرها نیاز به احراز هویت دارند
router.use(authenticateToken);

// GET /api/notifications - دریافت لیست اعلان‌ها
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread/count - تعداد خوانده نشده
router.get('/unread/count', notificationController.getUnreadCount);

// GET /api/notifications/stats - آمار اعلان‌ها
router.get('/stats', notificationController.getStats);

// PUT /api/notifications/read-all - علامت‌گذاری همه به عنوان خوانده شده
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/notifications/read/all - حذف همه خوانده شده‌ها
router.delete('/read/all', notificationController.deleteAllRead);

// POST /api/notifications/bulk - ارسال گروهی (فقط ادمین)
router.post('/bulk', isAdmin, notificationController.sendBulkNotification);

// GET /api/notifications/:id - دریافت یک اعلان
router.get('/:id', notificationController.getNotificationById);

// PUT /api/notifications/:id/read - علامت‌گذاری به عنوان خوانده شده
router.put('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id - حذف اعلان
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
