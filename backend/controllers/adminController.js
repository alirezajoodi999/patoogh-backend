// backend/controllers/adminController.js
const { pool } = require('../config/database');

// User Management
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, is_active, search } = req.query;
    const offset = (page - 1) * limit;

    // ۱. هماهنگ‌سازی با فیلد full_name در دیتابیس شما
    let query = `
      SELECT id, full_name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role && role !== 'all') {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (is_active !== undefined && is_active !== 'all') {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true' || is_active === true);
      paramIndex++;
    }

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    let countQuery = query.replace('id, full_name, email, role, is_active, created_at, updated_at', 'COUNT(*) as total');
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const { rows: users } = await pool.query(query, params);
    
    const countParams = params.slice(0, paramIndex - 1);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // پاسخ دقیقا هماهنگ با تایپ UserListResponse فرانت‌اند شما
    res.json({
      success: true,
      users: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT id, full_name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// ⚠️ اصلاح شده: اکنون فیلد role نیز در بدنه متد updateUser به روزرسانی می‌شود تا درخواست‌های فرانت‌اند به درستی اعمال شوند
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body; // 👈 فیلد role اضافه شد

    // بررسی صحت نقش ارسالی در صورت تغییر
    // نقش‌های مجاز بر اساس مستندات پاتوق:
    // admin → ادمین فنی | hr_admin → ادمین آموزش و توسعه | manager → مدیران سازمان
    if (role && !['admin', 'hr_admin', 'manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نقش انتخاب شده نامعتبر است. نقش‌های مجاز: admin, hr_admin, manager'
      });
    }

    const { rows } = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($2, full_name), 
           email = COALESCE($3, email),
           role = COALESCE($4, role), -- 👈 بروزرسانی فیلد نقش در کوئری
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, role, is_active, created_at, updated_at`,
      [id, full_name, email, role]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // بررسی وابستگی‌ها پیش از حذف کاربر به جهت پیشگیری از خطای Foreign Key Constraint
    await client.query('DELETE FROM user_progress WHERE user_id = $1', [id]);
    await client.query('DELETE FROM user_favorites WHERE user_id = $1', [id]);
    await client.query('DELETE FROM content_evaluations WHERE user_id = $1', [id]);
    await client.query('DELETE FROM reminders WHERE user_id = $1', [id]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    await client.query('DELETE FROM content_suggestions WHERE user_id = $1 OR suggested_by_user_id = $1', [id]);

    const { rowCount } = await client.query('DELETE FROM users WHERE id = $1', [id]);

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // نقش‌های معتبر پاتوق - صفحه ۱۵ مستندات
    if (!['admin', 'hr_admin', 'manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'نقش نامعتبر است'
      });
    }

    const { rows } = await pool.query(
      `UPDATE users 
       SET role = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, role, is_active, created_at, updated_at`,
      [id, role]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { rows } = await pool.query(
      `UPDATE users 
       SET is_active = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, role, is_active, created_at, updated_at`,
      [id, is_active]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// Content Management
exports.getPendingContent = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        mi.*,
        mt.name_fa AS media_type_name,
        u.full_name AS creator_name
      FROM media_items mi
      LEFT JOIN media_types mt ON mi.media_type_id = mt.id
      LEFT JOIN users u ON mi.created_by = u.id
      WHERE mi.is_published = false
      ORDER BY mi.created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

exports.approveContent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE media_items 
       SET is_published = true, published_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'محتوا یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.rejectContent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE media_items 
       SET is_published = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'محتوا یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// Reports
exports.getUsersReport = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE is_active = true) AS active_users,
        COUNT(*) FILTER (WHERE role = 'admin') AS admin_count,
        COUNT(*) FILTER (WHERE role = 'manager') AS manager_count,
        COUNT(*) FILTER (WHERE role = 'hr_admin') AS hr_admin_count,
        COUNT(*) FILTER (WHERE role = 'manager') AS manager_count
      FROM users
    `);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.getContentReport = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) AS total_content,
        COUNT(*) FILTER (WHERE is_published = true) AS approved_count,
        COUNT(*) FILTER (WHERE is_published = false) AS pending_count,
        mt.name_fa AS media_type,
        COUNT(*) AS count_by_type
      FROM media_items mi
      LEFT JOIN media_types mt ON mi.media_type_id = mt.id
      GROUP BY mt.name_fa
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

exports.getProgressReport = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) AS users_with_progress,
        AVG(progress_percentage) AS avg_progress,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
      FROM user_progress
    `);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.getEvaluationsReport = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) AS total_evaluations,
        AVG(rating) AS avg_rating,
        COUNT(DISTINCT user_id) AS users_evaluated,
        COUNT(DISTINCT media_item_id) AS content_evaluated
      FROM content_evaluations
    `);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

exports.exportReport = async (req, res, next) => {
  try {
    res.json({
      success: false,
      message: 'قابلیت export هنوز پیاده‌سازی نشده است'
    });
  } catch (err) {
    next(err);
  }
};

// System Statistics
exports.getDashboardStatistics = async (req, res, next) => {
  try {
    const usersStats = await pool.query('SELECT COUNT(*) AS total FROM users');
    const contentStats = await pool.query('SELECT COUNT(*) AS total FROM media_items');
    const progressStats = await pool.query('SELECT AVG(progress_percentage) AS avg FROM user_progress');

    res.json({
      success: true,
      data: {
        total_users: usersStats.rows[0].total,
        total_content: contentStats.rows[0].total,
        avg_progress: progressStats.rows[0].avg || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    // بازگردانی گزارش بر اساس ساختار جدول نوتیفیکیشن‌ها به عنوان تاریخچه فعالیت
    const { rows } = await pool.query(`
      SELECT id, title, notification_type, created_at FROM notifications
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// Notifications
exports.sendBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;

    const { rows } = await pool.query('SELECT id FROM users WHERE is_active = true');
    const userIds = rows.map(r => r.id);

    if (userIds.length === 0) {
      return res.json({ success: true, message: 'کاربر فعالی یافت نشد' });
    }

    await pool.query(`
      INSERT INTO notifications (user_id, title, message, notification_type)
      SELECT unnest($1::uuid[]), $2, $3, $4
    `, [userIds, title, message, type || 'info']);

    res.json({
      success: true,
      message: 'اعلان به همه کاربران ارسال شد'
    });
  } catch (err) {
    next(err);
  }
};

// Suggestions Management
exports.listSuggestions = async (req, res, next) => {
  try {
    const { status } = req.query;

    const params = [];
    let where = 'WHERE 1=1';

    if (status) {
      params.push(status);
      where += ` AND s.status = $${params.length}`;
    }

    const query = `
      SELECT
        s.*,
        u.full_name AS user_name,
        u.email AS user_email,
        c.name_fa AS competency_title,
        mt.name_fa AS media_type
      FROM content_suggestions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN competencies c ON s.suggested_competency_id = c.id
      LEFT JOIN media_types mt ON s.suggested_media_type_id = mt.id
      ${where}
      ORDER BY s.created_at DESC
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

exports.decideOnSuggestion = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { decision, admin_notes } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision باید approved یا rejected باشد'
      });
    }

    await client.query('BEGIN');

    const selectQuery = `
      SELECT *
      FROM content_suggestions
      WHERE id = $1
      FOR UPDATE
    `;
    const { rows } = await client.query(selectQuery, [id]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
      });
    }

    const updateQuery = `
      UPDATE content_suggestions
      SET
        status = $2,
        reviewed_by = $3,
        admin_notes = $4,
        reviewed_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const updated = await client.query(updateQuery, [
      id,
      decision,
      adminId,
      admin_notes || null
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
