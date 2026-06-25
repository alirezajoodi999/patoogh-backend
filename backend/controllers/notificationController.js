// backend/controllers/notificationController.js
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * GET /api/notifications
 * دریافت لیست اعلان‌های کاربر
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type,
      priority
    } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type,
      priority
    });

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('❌ خطا در دریافت اعلان‌ها:', error);
    next(error);
  }
};

/**
 * GET /api/notifications/:id
 * دریافت جزئیات یک اعلان
 */
exports.getNotificationById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.getNotificationById(id, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    if (error.message === 'اعلان یافت نشد') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    logger.error('❌ خطا در دریافت اعلان:', error);
    next(error);
  }
};

/**
 * GET /api/notifications/unread/count
 * دریافت تعداد اعلان‌های خوانده نشده
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    logger.error('❌ خطا در دریافت تعداد اعلان‌های خوانده نشده:', error);
    next(error);
  }
};

/**
 * GET /api/notifications/stats
 * دریافت آمار اعلان‌های کاربر
 */
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await notificationService.getUserNotificationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ خطا در دریافت آمار اعلان‌ها:', error);
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 * علامت‌گذاری اعلان به عنوان خوانده شده
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification,
      message: 'اعلان به عنوان خوانده شده علامت‌گذاری شد'
    });
  } catch (error) {
    if (error.message === 'اعلان یافت نشد') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    logger.error('❌ خطا در علامت‌گذاری اعلان:', error);
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 * علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { count },
      message: `${count} اعلان به عنوان خوانده شده علامت‌گذاری شد`
    });
  } catch (error) {
    logger.error('❌ خطا در علامت‌گذاری همه اعلان‌ها:', error);
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * حذف یک اعلان
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: 'اعلان با موفقیت حذف شد'
    });
  } catch (error) {
    if (error.message === 'اعلان یافت نشد') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    logger.error('❌ خطا در حذف اعلان:', error);
    next(error);
  }
};

/**
 * DELETE /api/notifications/read/all
 * حذف همه اعلان‌های خوانده شده
 */
exports.deleteAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.deleteAllRead(userId);

    res.json({
      success: true,
      data: { count },
      message: `${count} اعلان خوانده شده حذف شد`
    });
  } catch (error) {
    logger.error('❌ خطا در حذف اعلان‌های خوانده شده:', error);
    next(error);
  }
};

/**
 * POST /api/notifications/bulk
 * ارسال اعلان گروهی (فقط برای ادمین)
 */
exports.sendBulkNotification = async (req, res, next) => {
  try {
    const {
      userIds,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      priority,
      expiresAt
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds الزامی است و باید آرایه‌ای غیر خالی باشد'
      });
    }

    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: 'type و title الزامی هستند'
      });
    }

    const notifications = await notificationService.sendBulkNotification({
      userIds,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      priority,
      expiresAt
    });

    res.status(201).json({
      success: true,
      data: notifications,
      message: `${notifications.length} اعلان گروهی ارسال شد`
    });
  } catch (error) {
    logger.error('❌ خطا در ارسال اعلان گروهی:', error);
    next(error);
  }
};
