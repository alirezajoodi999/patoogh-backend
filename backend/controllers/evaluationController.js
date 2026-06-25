// backend/controllers/evaluationController.js
const pool = require('../config/database');

// GET /api/evaluations/criteria
// دریافت لیست معیارهای ارزیابی فعال
exports.getEvaluationCriteria = async (req, res, next) => {
  try {
    const query = `
      SELECT *
      FROM evaluation_criteria
      WHERE is_active = true
      ORDER BY display_order ASC, name_fa ASC
    `;

    const { rows } = await pool.query(query);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/evaluations
// ثبت یا ویرایش ارزیابی کاربر برای یک محتوا
// body: { content_id, evaluations: [{ criterion_id, rating, comment }] }
exports.submitEvaluation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { content_id, evaluations } = req.body;

    if (!content_id || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'content_id و evaluations الزامی هستند'
      });
    }

    // بررسی وجود محتوا
    const contentCheck = await client.query(
      'SELECT id FROM media_items WHERE id = $1',
      [content_id]
    );

    if (contentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'محتوا یافت نشد'
      });
    }

    await client.query('BEGIN');

    // حذف ارزیابی‌های قبلی این کاربر برای این محتوا
    await client.query(
      `DELETE FROM content_evaluations 
       WHERE media_item_id = $1 AND user_id = $2`,
      [content_id, userId]
    );

    // درج ارزیابی‌های جدید
    const insertedEvaluations = [];

    for (const evaluation of evaluations) {
      const { criterion_id, rating, comment } = evaluation;

      if (!rating || rating < 1 || rating > 5) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'rating باید بین 1 تا 5 باشد'
        });
      }

      const insertQuery = `
        INSERT INTO content_evaluations (
          media_item_id,
          user_id,
          criterion_id,
          rating,
          comment
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        content_id,
        userId,
        criterion_id || null,
        rating,
        comment || null
      ]);

      insertedEvaluations.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'ارزیابی با موفقیت ثبت شد',
      data: insertedEvaluations
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/evaluations/content/:contentId
// دریافت خلاصه ارزیابی‌های یک محتوا
exports.getContentEvaluations = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    // میانگین امتیاز به تفکیک معیار
    const criteriaQuery = `
      SELECT
        ec.id AS criterion_id,
        ec.name_fa,
        ec.name_en,
        ec.weight,
        COUNT(ce.id) AS evaluation_count,
        ROUND(AVG(ce.rating), 2) AS avg_rating
      FROM evaluation_criteria ec
      LEFT JOIN content_evaluations ce 
        ON ce.criterion_id = ec.id 
        AND ce.media_item_id = $1
      WHERE ec.is_active = true
      GROUP BY ec.id, ec.name_fa, ec.name_en, ec.weight, ec.display_order
      ORDER BY ec.display_order ASC
    `;

    const criteriaResult = await pool.query(criteriaQuery, [contentId]);

    // میانگین کلی
    const overallQuery = `
      SELECT
        COUNT(DISTINCT user_id) AS total_users,
        ROUND(AVG(rating), 2) AS overall_avg_rating
      FROM content_evaluations
      WHERE media_item_id = $1
    `;

    const overallResult = await pool.query(overallQuery, [contentId]);

    // کامنت‌های کاربران (آخرین 10 تا)
    const commentsQuery = `
      SELECT
        ce.id,
        ce.rating,
        ce.comment,
        ce.created_at,
        u.name AS user_name,
        ec.name_fa AS criterion_name
      FROM content_evaluations ce
      JOIN users u ON ce.user_id = u.id
      LEFT JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
      WHERE ce.media_item_id = $1 AND ce.comment IS NOT NULL
      ORDER BY ce.created_at DESC
      LIMIT 10
    `;

    const commentsResult = await pool.query(commentsQuery, [contentId]);

    res.json({
      success: true,
      data: {
        criteria: criteriaResult.rows,
        overall: overallResult.rows[0],
        comments: commentsResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/evaluations/content/:contentId/me
// دریافت ارزیابی خود کاربر برای یک محتوا
exports.getUserEvaluation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contentId } = req.params;

    const query = `
      SELECT
        ce.*,
        ec.name_fa AS criterion_name,
        ec.name_en AS criterion_name_en
      FROM content_evaluations ce
      LEFT JOIN evaluation_criteria ec ON ce.criterion_id = ec.id
      WHERE ce.media_item_id = $1 AND ce.user_id = $2
      ORDER BY ec.display_order ASC
    `;

    const { rows } = await pool.query(query, [contentId, userId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// ========== Admin endpoints ==========

// POST /api/evaluations/criteria
// ایجاد معیار ارزیابی جدید (فقط ادمین)
exports.createCriterion = async (req, res, next) => {
  try {
    const { name_fa, name_en, description, weight, display_order } = req.body;

    if (!name_fa) {
      return res.status(400).json({
        success: false,
        message: 'name_fa الزامی است'
      });
    }

    const query = `
      INSERT INTO evaluation_criteria (
        name_fa,
        name_en,
        description,
        weight,
        display_order
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      name_fa,
      name_en || null,
      description || null,
      weight || 1.0,
      display_order || 0
    ]);

    res.status(201).json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/evaluations/criteria/:id
// ویرایش معیار ارزیابی (فقط ادمین)
exports.updateCriterion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name_fa, name_en, description, weight, display_order, is_active } = req.body;

    const query = `
      UPDATE evaluation_criteria
      SET
        name_fa = COALESCE($2, name_fa),
        name_en = COALESCE($3, name_en),
        description = COALESCE($4, description),
        weight = COALESCE($5, weight),
        display_order = COALESCE($6, display_order),
        is_active = COALESCE($7, is_active)
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      id,
      name_fa || null,
      name_en || null,
      description || null,
      weight || null,
      display_order !== undefined ? display_order : null,
      typeof is_active === 'boolean' ? is_active : null
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'معیار یافت نشد'
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

// DELETE /api/evaluations/criteria/:id
// حذف معیار ارزیابی (فقط ادمین)
exports.deleteCriterion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM evaluation_criteria
      WHERE id = $1
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'معیار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'معیار با موفقیت حذف شد'
    });
  } catch (err) {
    next(err);
  }
};
