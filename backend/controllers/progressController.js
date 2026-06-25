// backend/controllers/progressController.js
const pool = require('../config/database');

// GET /api/progress/me?competency_id=&content_id=
exports.getUserProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { competency_id, content_id } = req.query;

    const params = [userId];
    let where = 'WHERE up.user_id = $1';

    if (competency_id) {
      params.push(competency_id);
      where += ` AND up.competency_id = $${params.length}`;
    }

    if (content_id) {
      params.push(content_id);
      where += ` AND up.media_item_id = $${params.length}`;
    }

    const query = `
      SELECT
        up.*,
        c.title AS competency_title,
        mi.title AS content_title,
        mt.name AS media_type
      FROM user_progress up
      LEFT JOIN competencies c ON up.competency_id = c.id
      LEFT JOIN media_items mi ON up.media_item_id = mi.id
      LEFT JOIN media_types mt ON mi.media_type_id = mt.id
      ${where}
      ORDER BY up.last_accessed_at DESC
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

// POST /api/progress
// body: { content_id, competency_id, progress_percent, status, last_position }
exports.updateProgress = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const {
      content_id,
      competency_id,
      progress_percent,
      status,
      last_position
    } = req.body;

    if (!content_id && !competency_id) {
      return res.status(400).json({
        success: false,
        message: 'content_id یا competency_id الزامی است'
      });
    }

    await client.query('BEGIN');

    const selectQuery = `
      SELECT id
      FROM user_progress
      WHERE user_id = $1
        AND COALESCE(media_item_id, 0) = COALESCE($2, 0)
        AND COALESCE(competency_id, 0) = COALESCE($3, 0)
      FOR UPDATE
    `;
    const selectParams = [userId, content_id || null, competency_id || null];
    const { rows } = await client.query(selectQuery, selectParams);

    let result;

    if (rows.length > 0) {
      const updateQuery = `
        UPDATE user_progress
        SET
          progress_percent = COALESCE($4, progress_percent),
          status = COALESCE($5, status),
          last_position = COALESCE($6, last_position),
          last_accessed_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      result = await client.query(updateQuery, [
        userId,
        content_id || null,
        competency_id || null,
        progress_percent,
        status,
        last_position,
        rows[0].id
      ]);
    } else {
      const insertQuery = `
        INSERT INTO user_progress (
          user_id,
          media_item_id,
          competency_id,
          progress_percent,
          status,
          last_position,
          last_accessed_at
        ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
        RETURNING *
      `;
      result = await client.query(insertQuery, [
        userId,
        content_id || null,
        competency_id || null,
        progress_percent || 0,
        status || 'in_progress',
        last_position || null
      ]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/progress/summary
exports.getProgressSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        c.id AS competency_id,
        c.title AS competency_title,
        COUNT(up.id) AS content_count,
        COALESCE(AVG(up.progress_percent), 0) AS avg_progress,
        SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) AS completed_count
      FROM competencies c
      LEFT JOIN competency_media_map cmm ON cmm.competency_id = c.id
      LEFT JOIN media_items mi ON mi.id = cmm.media_item_id
      LEFT JOIN user_progress up
        ON up.media_item_id = mi.id
       AND up.user_id = $1
      GROUP BY c.id, c.title
      ORDER BY c.priority ASC, c.id ASC
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

// GET /api/progress/competency/:competencyId
exports.getCompetencyProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { competencyId } = req.params;

    const query = `
      SELECT
        mi.id AS content_id,
        mi.title AS content_title,
        mt.name AS media_type,
        up.progress_percent,
        up.status,
        up.last_accessed_at,
        up.last_position
      FROM competency_media_map cmm
      JOIN media_items mi ON mi.id = cmm.media_item_id
      LEFT JOIN media_types mt ON mi.media_type_id = mt.id
      LEFT JOIN user_progress up
        ON up.media_item_id = mi.id
       AND up.user_id = $1
      WHERE cmm.competency_id = $2
      ORDER BY cmm.sequence_order ASC, mi.id ASC
    `;

    const { rows } = await pool.query(query, [userId, competencyId]);

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress/dashboard
exports.getProgressDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const statsQuery = `
      SELECT
        COUNT(DISTINCT up.media_item_id) AS total_content_accessed,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.media_item_id END) AS completed_content,
        COALESCE(AVG(up.progress_percent), 0) AS overall_progress
      FROM user_progress up
      WHERE up.user_id = $1
    `;

    const recentQuery = `
      SELECT
        up.*,
        mi.title AS content_title,
        mt.name AS media_type,
        c.title AS competency_title
      FROM user_progress up
      LEFT JOIN media_items mi ON up.media_item_id = mi.id
      LEFT JOIN media_types mt ON mi.media_type_id = mt.id
      LEFT JOIN competencies c ON up.competency_id = c.id
      WHERE up.user_id = $1
      ORDER BY up.last_accessed_at DESC
      LIMIT 10
    `;

    const [statsResult, recentResult] = await Promise.all([
      pool.query(statsQuery, [userId]),
      pool.query(recentQuery, [userId])
    ]);

    res.json({
      success: true,
      data: {
        statistics: statsResult.rows[0],
        recent_activity: recentResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress/statistics
exports.getProgressStatistics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        COUNT(DISTINCT up.media_item_id) AS total_items,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.media_item_id END) AS completed_items,
        COUNT(DISTINCT CASE WHEN up.status = 'in_progress' THEN up.media_item_id END) AS in_progress_items,
        COALESCE(AVG(up.progress_percent), 0) AS avg_progress,
        COUNT(DISTINCT up.competency_id) AS competencies_touched,
        MAX(up.last_accessed_at) AS last_activity
      FROM user_progress up
      WHERE up.user_id = $1
    `;

    const { rows } = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress/user/:userId (admin only)
exports.getUserProgressById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if requester is admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }

    const query = `
      SELECT
        up.*,
        c.title AS competency_title,
        mi.title AS content_title,
        mt.name AS media_type
      FROM user_progress up
      LEFT JOIN competencies c ON up.competency_id = c.id
      LEFT JOIN media_items mi ON up.media_item_id = mi.id
      LEFT JOIN media_types mt ON mi.media_type_id = mt.id
      WHERE up.user_id = $1
      ORDER BY up ORDER BY up.last_accessed_at DESC
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

// POST /api/progress/complete
exports.markContentComplete = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content_id, competency_id } = req.body;

    const query = `
      INSERT INTO user_progress (
        user_id,
        media_item_id,
        competency_id,
        progress_percent,
        status,
        last_accessed_at
      )
      VALUES ($1,$2,$3,100,'completed',NOW())
      ON CONFLICT (user_id, media_item_id, competency_id)
      DO UPDATE SET
        progress_percent = 100,
        status = 'completed',
        last_accessed_at = NOW()
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      userId,
      content_id || null,
      competency_id || null
    ]);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress/report
exports.generateProgressReport = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        c.title AS competency,
        COUNT(mi.id) AS total_content,
        COUNT(up.id) FILTER (WHERE up.status='completed') AS completed,
        COALESCE(AVG(up.progress_percent),0) AS avg_progress
      FROM competencies c
      LEFT JOIN competency_media_map cmm ON cmm.competency_id = c.id
      LEFT JOIN media_items mi ON mi.id = cmm.media_item_id
      LEFT JOIN user_progress up
        ON up.media_item_id = mi.id
       AND up.user_id = $1
      GROUP BY c.title
      ORDER BY c.title
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
