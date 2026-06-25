// backend/controllers/competencyController.js
const pool = require('../config/db');

/**
 * دریافت لیست تمام شایستگی‌ها
 */
exports.getAllCompetencies = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { is_active } = req.query;

    let query = `
      SELECT id, name_fa, name_en, description, icon, color, 
             display_order, is_active, created_at, updated_at
      FROM competencies
    `;
    const params = [];

    if (is_active !== undefined) {
      query += ' WHERE is_active = $1';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY display_order ASC, name_fa ASC';

    const result = await client.query(query, params);

    res.json({
      success: true,
      data: { 
        competencies: result.rows,
        total: result.rows.length
      }
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/**
 * دریافت جزئیات یک شایستگی
 */
exports.getCompetencyById = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const result = await client.query(
      `SELECT id, name_fa, name_en, description, icon, color, 
              display_order, is_active, created_at, updated_at
       FROM competencies
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'شایستگی یافت نشد' 
      });
    }

    res.json({
      success: true,
      data: { competency: result.rows[0] }
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/**
 * دریافت محتواهای مرتبط با یک شایستگی
 */
exports.getCompetencyContent = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // بررسی وجود شایستگی
    const competencyCheck = await client.query(
      'SELECT id FROM competencies WHERE id = $1',
      [id]
    );

    if (competencyCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'شایستگی یافت نشد' 
      });
    }

    // دریافت محتواها
    const result = await client.query(
      `SELECT 
         c.id, c.title, c.description, c.file_url, c.thumbnail_url,
         c.duration, c.difficulty_level, c.language, c.tags,
         c.view_count, c.like_count, c.published_at,
         mt.name_fa as media_type_name, mt.icon as media_type_icon,
         cs.source_name, cs.source_type,
         cm.relevance_score, cm.is_primary,
         u.full_name as creator_name
       FROM contents c
       INNER JOIN competency_content_map cm ON c.id = cm.content_id
       LEFT JOIN media_types mt ON c.media_type_id = mt.id
       LEFT JOIN content_sources cs ON c.content_source_id = cs.id
       LEFT JOIN users u ON c.created_by = u.id
       WHERE cm.competency_id = $1 AND c.is_published = true
       ORDER BY cm.is_primary DESC, cm.relevance_score DESC, c.published_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // شمارش کل
    const countResult = await client.query(
      `SELECT COUNT(*) as total
       FROM contents c
       INNER JOIN competency_content_map cm ON c.id = cm.content_id
       WHERE cm.competency_id = $1 AND c.is_published = true`,
      [id]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        content: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/**
 * ایجاد شایستگی جدید (فقط ادمین)
 */
exports.createCompetency = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { name_fa, name_en, description, icon, color, display_order } = req.body;

    const result = await client.query(
      `INSERT INTO competencies (name_fa, name_en, description, icon, color, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name_fa, name_en, description, icon, color, display_order]
    );

    res.status(201).json({
      success: true,
      message: 'شایستگی با موفقیت ایجاد شد',
      data: { competency: result.rows[0] }
    });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ 
        success: false, 
        message: 'شایستگی با این نام قبلاً ثبت شده است' 
      });
    }
    next(error);
  } finally {
    client.release();
  }
};

/**
 * به‌روزرسانی شایستگی (فقط ادمین)
 */
exports.updateCompetency = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name_fa, name_en, description, icon, color, display_order, is_active } = req.body;

    const result = await client.query(
      `UPDATE competencies
       SET name_fa = COALESCE($1, name_fa),
           name_en = COALESCE($2, name_en),
           description = COALESCE($3, description),
           icon = COALESCE($4, icon),
           color = COALESCE($5, color),
           display_order = COALESCE($6, display_order),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [name_fa, name_en, description, icon, color, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'شایستگی یافت نشد' 
      });
    }

    res.json({
      success: true,
      message: 'شایستگی با موفقیت به‌روزرسانی شد',
      data: { competency: result.rows[0] }
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/**
 * حذف شایستگی (فقط ادمین)
 */
exports.deleteCompetency = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const result = await client.query(
      'DELETE FROM competencies WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'شایستگی یافت نشد' 
      });
    }

    res.json({
      success: true,
      message: 'شایستگی با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};
