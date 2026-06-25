// backend/controllers/suggestionController.js
const pool = require('../config/database');

// GET /api/suggestions (current user's suggestions)
exports.getMySuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        s.*,
        mi.title AS content_title,
        c.title AS competency_title
      FROM content_suggestions s
      LEFT JOIN media_items mi ON s.media_item_id = mi.id
      LEFT JOIN competencies c ON s.competency_id = c.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `;

    const { rows } = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suggestions/all (Admin/ContentManager)
exports.getAllSuggestions = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        s.*,
        u.username,
        u.email,
        mi.title AS content_title,
        c.title AS competency_title
      FROM content_suggestions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN media_items mi ON s.media_item_id = mi.id
      LEFT JOIN competencies c ON s.competency_id = c.id
    `;

    const params = [];
    if (status) {
      query += ` WHERE s.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY s.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/suggestions/:id
exports.getSuggestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
      SELECT
        s.*,
        u.username,
        u.email,
        mi.title AS content_title,
        c.title AS competency_title
      FROM content_suggestions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN media_items mi ON s.media_item_id = mi.id
      LEFT JOIN competencies c ON s.competency_id = c.id
      WHERE s.id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
      });
    }

    // Check permission: owner or admin/content_manager
    if (rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'content_manager') {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
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

// POST /api/suggestions
exports.createSuggestion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      url,
      description,
      competency_id,
      media_type_id
    } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'title و url الزامی هستند'
      });
    }

    const query = `
      INSERT INTO content_suggestions (
        user_id,
        title,
        url,
        description,
        competency_id,
        media_type_id,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,'pending')
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      userId,
      title,
      url,
      description || null,
      competency_id || null,
      media_type_id || null
    ]);

    res.status(201).json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/suggestions/:id
exports.updateSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      title,
      url,
      description,
      competency_id,
      media_type_id
    } = req.body;

    // Check ownership
    const checkQuery = 'SELECT user_id, status FROM content_suggestions WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'فقط صاحب پیشنهاد می‌تواند آن را ویرایش کند'
      });
    }

    if (checkResult.rows[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'فقط پیشنهادهای در انتظار قابل ویرایش هستند'
      });
    }

    const query = `
      UPDATE content_suggestions
      SET
        title = COALESCE($1, title),
        url = COALESCE($2, url),
        description = COALESCE($3, description),
        competency_id = COALESCE($4, competency_id),
        media_type_id = COALESCE($5, media_type_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      title,
      url,
      description,
      competency_id,
      media_type_id,
      id
    ]);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/suggestions/:id
exports.deleteSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check ownership or admin
    const checkQuery = 'SELECT user_id FROM content_suggestions WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
      });
    }

    if (checkResult.rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'content_manager') {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }

    await pool.query('DELETE FROM content_suggestions WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'پیشنهاد با موفقیت حذف شد'
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/suggestions/:id/status (Admin/ContentManager)
exports.updateSuggestionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است'
      });
    }

    const query = `
      UPDATE content_suggestions
      SET
        status = $1,
        admin_notes = $2,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      status,
      admin_notes || null,
      req.user.id,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
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

// POST /api/suggestions/:id/approve (Admin/ContentManager)
exports.approveSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const query = `
      UPDATE content_suggestions
      SET
        status = 'approved',
        admin_notes = $1,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      admin_notes || null,
      req.user.id,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'پیشنهاد تایید شد',
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/suggestions/:id/reject (Admin/ContentManager)
exports.rejectSuggestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const query = `
      UPDATE content_suggestions
      SET
        status = 'rejected',
        admin_notes = $1,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      admin_notes || null,
      req.user.id,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پیشنهاد یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'پیشنهاد رد شد',
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};
