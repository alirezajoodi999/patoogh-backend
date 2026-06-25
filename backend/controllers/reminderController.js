// backend/controllers/reminderController.js
const pool = require('../config/database');

// GET /api/reminders/me
exports.getMyReminders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        r.*,
        mi.title AS content_title,
        c.title AS competency_title
      FROM reminders r
      LEFT JOIN media_items mi ON r.media_item_id = mi.id
      LEFT JOIN competencies c ON r.competency_id = c.id
      WHERE r.user_id = $1
      ORDER BY r.remind_at ASC
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

// POST /api/reminders
// body: { content_id, competency_id, remind_at, message }
exports.createReminder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content_id, competency_id, remind_at, message } = req.body;

    if (!remind_at) {
      return res.status(400).json({
        success: false,
        message: 'remind_at الزامی است'
      });
    }

    const query = `
      INSERT INTO reminders (
        user_id,
        media_item_id,
        competency_id,
        remind_at,
        message,
        is_sent
      ) VALUES ($1,$2,$3,$4,$5,false)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      userId,
      content_id || null,
      competency_id || null,
      remind_at,
      message || null
    ]);

    res.status(201).json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/reminders/:id
// body: { remind_at, message, is_done }
exports.updateReminder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { remind_at, message, is_done } = req.body;

    const query = `
      UPDATE reminders
      SET
        remind_at = COALESCE($3, remind_at),
        message = COALESCE($4, message),
        is_done = COALESCE($5, is_done),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      id,
      userId,
      remind_at || null,
      message || null,
      typeof is_done === 'boolean' ? is_done : null
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'یادآور پیدا نشد'
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

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const query = `
      DELETE FROM reminders
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id, userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'یادآور پیدا نشد'
      });
    }

    res.json({
      success: true,
      message: 'یادآور با موفقیت حذف شد'
    });
  } catch (err) {
    next(err);
  }
};
