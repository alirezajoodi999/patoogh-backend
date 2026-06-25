// backend/services/notificationService.js
const { Notification, User } = require('../models');
const { Op } = require('sequelize');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * ایجاد اعلان جدید
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    relatedEntityType = null,
    relatedEntityId = null,
    actionUrl = null,
    priority = 'normal',
    expiresAt = null,
    metadata = {}
  }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        actionUrl,
        priority,
        expiresAt,
        metadata,
        isRead: false
      });

      logger.info(`✅ اعلان جدید برای کاربر ${userId} ایجاد شد (نوع: ${type})`);

      // ارسال ایمیل اگر کاربر تنظیمات ایمیل را فعال کرده باشد
      const user = await User.findByPk(userId);
      if (user && user.emailNotifications) {
        await emailService.sendNotificationEmail(user, notification);
      }

      return notification;
    } catch (error) {
      logger.error('❌ خطا در ایجاد اعلان:', error);
      throw error;
    }
  }

  /**
   * دریافت یک اعلان خاص
   */
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          userId
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ]
      });

      if (!notification) {
        throw new Error('اعلان یافت نشد');
      }

      return notification;
    } catch (error) {
      logger.error('❌ خطا در دریافت اعلان:', error);
      throw error;
    }
  }

  /**
   * دریافت اعلان‌های کاربر با فیلتر و pagination
   */
  async getUserNotifications(userId, {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null,
    priority = null
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      const where = { userId };

      if (unreadOnly) {
        where.isRead = false;
      }

      if (type) {
        where.type = type;
      }

      if (priority) {
        where.priority = priority;
      }

      // حذف اعلان‌های منقضی شده
      where[Op.or] = [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ];

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit,
        offset
      });

      return {
        notifications: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('❌ خطا در دریافت اعلان‌ها:', error);
      throw error;
    }
  }

  /**
   * علامت‌گذاری اعلان به عنوان خوانده‌شده
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw new Error('اعلان یافت نشد');
      }

      if (notification.isRead) {
        return notification;
      }

      await notification.markAsRead();

      logger.info(`✅ اعلان ${notificationId} به عنوان خوانده‌شده علامت‌گذاری شد`);
      return notification;
    } catch (error) {
      logger.error('❌ خطا در علامت‌گذاری اعلان:', error);
      throw error;
    }
  }

  /**
   * علامت‌گذاری همه اعلان‌ها به عنوان خوانده‌شده
   */
  async markAllAsRead(userId) {
    try {
      const [updatedCount] = await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId, isRead: false } }
      );

      logger.info(`✅ ${updatedCount} اعلان برای کاربر ${userId} به عنوان خوانده‌شده علامت‌گذاری شد`);
      return updatedCount;
    } catch (error) {
      logger.error('❌ خطا در علامت‌گذاری همه اعلان‌ها:', error);
      throw error;
    }
  }

  /**
   * حذف اعلان
   */
  async deleteNotification(notificationId, userId) {
    try {
      const deleted = await Notification.destroy({
        where: { id: notificationId, userId }
      });

      if (!deleted) {
        throw new Error('اعلان یافت نشد');
      }

      logger.info(`✅ اعلان ${notificationId} حذف شد`);
      return true;
    } catch (error) {
      logger.error('❌ خطا در حذف اعلان:', error);
      throw error;
    }
  }

  /**
   * حذف همه اعلان‌های خوانده شده
   */
  async deleteAllRead(userId) {
    try {
      const deleted = await Notification.destroy({
        where: {
          userId,
          isRead: true
        }
      });

      logger.info(`✅ ${deleted} اعلان خوانده شده برای کاربر ${userId} حذف شد`);
      return deleted;
    } catch (error) {
      logger.error('❌ خطا در حذف اعلان‌های خوانده شده:', error);
      throw error;
    }
  }

  /**
   * تعداد اعلان‌های خوانده‌نشده
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: {
          userId,
          isRead: false,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });

      return count;
    } catch (error) {
      logger.error('❌ خطا در دریافت تعداد اعلان‌های خوانده‌نشده:', error);
      throw error;
    }
  }

  /**
   * ارسال اعلان گروهی
   */
  async sendBulkNotification({
    userIds,
    type,
    title,
    message,
    relatedEntityType = null,
    relatedEntityId = null,
    actionUrl = null,
    priority = 'normal',
    expiresAt = null
  }) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        actionUrl,
        priority,
        expiresAt,
        isRead: false
      }));

      const created = await Notification.bulkCreate(notifications);
      logger.info(`✅ ${created.length} اعلان گروهی ایجاد شد`);

      // ارسال ایمیل برای کاربرانی که تنظیمات ایمیل را فعال کرده‌اند
      const users = await User.findAll({
        where: {
          id: userIds,
          emailNotifications: true
        }
      });

      for (const user of users) {
        await emailService.sendNotificationEmail(user, {
          type,
          title,
          message
        });
      }

      return created;
    } catch (error) {
      logger.error('❌ خطا در ارسال اعلان گروهی:', error);
      throw error;
    }
  }

  /**
   * پاک‌سازی اعلان‌های قدیمی (خوانده شده و بیش از X روز)
   */
  async cleanupOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await Notification.destroy({
        where: {
          createdAt: { [Op.lt]: cutoffDate },
          isRead: true
        }
      });

      logger.info(`✅ ${deleted} اعلان قدیمی پاک‌سازی شد`);
      return deleted;
    } catch (error) {
      logger.error('❌ خطا در پاک‌سازی اعلان‌های قدیمی:', error);
      throw error;
    }
  }

  /**
   * پاک‌سازی اعلان‌های منقضی شده
   */
  async cleanupExpiredNotifications() {
    try {
      const deleted = await Notification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });

      logger.info(`✅ ${deleted} اعلان منقضی شده پاک‌سازی شد`);
      return deleted;
    } catch (error) {
      logger.error('❌ خطا در پاک‌سازی اعلان‌های منقضی شده:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار اعلان‌های کاربر
   */
  async getUserNotificationStats(userId) {
    try {
      const total = await Notification.count({ where: { userId } });
      const unread = await this.getUnreadCount(userId);
      const byType = await Notification.findAll({
        where: { userId },
        attributes: [
          'type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['type']
      });

      const byPriority = await Notification.findAll({
        where: { userId },
        attributes: [
          'priority',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['priority']
      });

      return {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.get('count'));
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = parseInt(item.get('count'));
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('❌ خطا در دریافت آمار اعلان‌ها:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
