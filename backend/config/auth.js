require('dotenv').config();

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'patoogh_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // نقش‌های سیستم پاتوق - صفحه ۱۵ مستندات
  roles: {
    ADMIN: 'admin',       // ادمین فنی
    HR_ADMIN: 'hr_admin', // ادمین آموزش و توسعه
    MANAGER: 'manager'    // مدیران سازمان
  },

  // دسترسی‌های هر نقش - صفحه ۱۶ مستندات
  permissions: {
    admin: [
      'read:all', 'write:all', 'delete:all',
      'manage:users', 'manage:roles', 'manage:system',
      'manage:security', 'manage:backup'
    ],
    hr_admin: [
      'read:all', 'write:content', 'write:competencies',
      'manage:content', 'manage:competencies',
      'read:reports', 'assign:content', 'manage:categories',
      'group:users'
    ],
    manager: [
      'read:content', 'read:own',
      'evaluate:content', 'comment:content',
      'favorite:content', 'save:content',
      'read:profile', 'write:profile'
    ]
  }
};
