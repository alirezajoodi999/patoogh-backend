const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * راه‌اندازی transporter برای ارسال ایمیل
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true برای 465, false برای سایر پورت‌ها
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      logger.info('✅ Email service راه‌اندازی شد');
    } catch (error) {
      logger.error('❌ خطا در راه‌اندازی email service:', error);
    }
  }

  /**
   * ارسال ایمیل عمومی
   */
  async sendEmail({ to, subject, text, html }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter راه‌اندازی نشده است');
      }

      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'سیستم پاتوق'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html: html || text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ ایمیل به ${to} ارسال شد - MessageID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('❌ خطا در ارسال ایمیل:', error);
      throw error;
    }
  }

  /**
   * ارسال ایمیل خوش‌آمدگویی
   */
  async sendWelcomeEmail(user) {
    const subject = 'خوش آمدید به سیستم پاتوق مدیریتی توگا';
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2c3e50;">سلام ${user.firstName} ${user.lastName} عزیز!</h2>
          <p style="font-size: 16px; line-height: 1.8; color: #555;">
            به سیستم مدیریت یادگیری پاتوق خوش آمدید.
          </p>
          <p style="font-size: 16px; line-height: 1.8; color: #555;">
            شما با موفقیت در سیستم ثبت‌نام کردید و می‌توانید از امکانات زیر استفاده کنید:
          </p>
          <ul style="font-size: 15px; color: #555;">
            <li>دسترسی به محتوای آموزشی متناسب با شایستگی‌های شما</li>
            <li>ارزیابی و رتبه‌دهی به محتواها</li>
            <li>پیگیری پیشرفت یادگیری</li>
            <li>دریافت یادآورهای هوشمند</li>
          </ul>
          <div style="margin-top: 30px; padding: 15px; background-color: #ecf0f1; border-radius: 5px;">
            <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
              <strong>نام کاربری:</strong> ${user.username}<br>
              <strong>ایمیل:</strong> ${user.email}<br>
              <strong>نقش:</strong> ${this.getRoleName(user.role)}
            </p>
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #95a5a6;">
            با تشکر،<br>
            تیم پاتوق مدیریتی توگا
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * ارسال ایمیل بازیابی رمز عبور
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${resetToken}`;
    
    const subject = 'بازیابی رمز عبور - سیستم پاتوق';
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #e74c3c;">درخواست بازیابی رمز عبور</h2>
          <p style="font-size: 16px; line-height: 1.8; color: #555;">
            سلام ${user.firstName} ${user.lastName} عزیز،
          </p>
          <p style="font-size: 16px; line-height: 1.8; color: #555;">
            درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.
            برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 15px 40px; background-color: #3498db; 
                      color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
              بازیابی رمز عبور
            </a>
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">
            یا می‌توانید لینک زیر را در مرورگر خود کپی کنید:
          </p>
          <p style="font-size: 13px; color: #95a5a6; word-break: break-all; background-color: #ecf0f1; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          <p style="margin-top: 30px; font-size: 14px; color: #e74c3c;">
            ⚠️ این لینک تنها برای <strong>1 ساعت</strong> معتبر است.
          </p>
          <p style="font-size: 14px; color: #7f8c8d;">
            اگر شما این درخواست را ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * ارسال ایمیل یادآور
   */
  async sendReminderEmail(user, reminder) {
    const subject = `یادآور: ${reminder.title}`;
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #f39c12;">🔔 یادآور</h2>
          <p style="font-size: 16px; line-height: 1.8; color: #555;">
            سلام ${user.firstName} عزیز،
          </p>
          <div style="background-color: #fff3cd; padding: 20px; border-right: 4px solid #f39c12; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">${reminder.title}</h3>
            <p style="color: #856404; margin-bottom: 0;">${reminder.description || 'یادآوری برای شما'}</p>
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">
            <strong>زمان یادآوری:</strong> ${new Date(reminder.reminderDate).toLocaleString('fa-IR')}
          </p>
          ${reminder.Content ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #ecf0f1; border-radius: 5px;">
              <p style="margin: 0; color: #2c3e50;">
                <strong>محتوای مرتبط:</strong> ${reminder.Content.title}
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * ارسال ایمیل اعلان
   */
  async sendNotificationEmail(user, notification) {
    const subject = notification.title;
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #3498db;">📬 اعلان جدید</h2>
          <p style="font-size: 16px; line-height: 1.8; color: #555;">
            سلام ${user.firstName} عزیز،
          </p>
          <div style="background-color: #d1ecf1; padding: 20px; border-right: 4px solid #3498db; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0c5460;">${notification.title}</h3>
            <p style="color: #0c5460; margin-bottom: 0;">${notification.message}</p>
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">
            <strong>نوع اعلان:</strong> ${this.getNotificationTypeName(notification.type)}
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * ارسال گزارش به ادمین
   */
  async sendAdminReport(adminEmail, reportData) {
    const subject = `گزارش سیستم - ${new Date().toLocaleDateString('fa-IR')}`;
    const html = `
      <div dir="rtl" style="font-family: Tahoma, Arial; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2c3e50;">📊 گزارش سیستم</h2>
          <div style="margin: 20px 0;">
            ${reportData.html || '<p>گزارش آماده است.</p>'}
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #95a5a6;">
            تاریخ تولید گزارش: ${new Date().toLocaleString('fa-IR')}
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  }

  /**
   * Helper: نام نقش به فارسی
   */
  getRoleName(role) {
    const roles = {
      admin: 'مدیر سیستم',
      manager: 'مدیر',
      hr_admin: 'ادمین آموزش و توسعه',
      manager: 'مدیر سازمان',
    };
    return roles[role] || role;
  }

  /**
   * Helper: نام نوع اعلان به فارسی
   */
  getNotificationTypeName(type) {
    const types = {
      reminder: 'یادآور',
      suggestion: 'پیشنهاد',
      evaluation: 'ارزیابی',
      progress: 'پیشرفت',
      system: 'سیستمی',
    };
    return types[type] || type;
  }
}

module.exports = new EmailService();
