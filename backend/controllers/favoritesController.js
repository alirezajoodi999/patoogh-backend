// backend/controllers/favoritesController.js
// ──────────────────────────────────────────────────────────────────────────────
// کنترلر علاقه‌مندی‌ها و ذخیره‌شده‌ها (Favorites & Saved/Bookmarks)
// ──────────────────────────────────────────────────────────────────────────────
const { pool } = require('../config/database');

// ═══════════════════════════════════════════════════════
// FAVORITES (علاقه‌مندی‌ها)
// ═══════════════════════════════════════════════════════

/**
 * @route   GET /api/content/favorites
 * @desc    دریافت لیست علاقه‌مندی‌های کاربر
 * @access  Private
 */
exports.getFavorites = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        uf.id,
        uf.user_id,
        uf.media_item_id,
        uf.created_at,
        m.title,
        m.description,
        m.file_url,
        m.thumbnail_url,
        m.duration,
        m.difficulty_level,
        m.language,
        m.tags,
        m.view_count,
        m.like_count,
        m.published_at,
        mt.name_fa AS media_type_name,
        mt.icon    AS media_type_icon,
        cs.source_name,
        cs.source_type
      FROM user_favorites uf
      JOIN media_items m ON uf.media_item_id = m.id
      LEFT JOIN media_types mt ON m.media_type_id = mt.id
      LEFT JOIN content_sources cs ON m.content_source_id = cs.id
      WHERE uf.user_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total FROM user_favorites WHERE user_id = $1
    `;

    const [result, countResult] = await Promise.all([
      client.query(query, [userId, limit, offset]),
      client.query(countQuery, [userId])
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        mediaItemId: row.media_item_id,
        createdAt: row.created_at,
        mediaItem: mapMediaItem(row)
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/**
 * @route   POST /api/content/:id/favorite
 * @desc    افزودن به علاقه‌مندی‌ها
 * @access  Private
 */
exports.addFavorite = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const mediaItemId = req.params.id;

    // بررسی وجود محتوا
    const exists = await client.query(
      'SELECT id FROM media_items WHERE id = $1 AND is_published = true',
      [mediaItemId]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'محتوا یافت نشد' });
    }

    // INSERT با ON CONFLICT DO NOTHING برای جلوگیری از تکرار
    await client.query(
      `INSERT INTO user_favorites (user_id, media_item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, media_item_id) DO NOTHING`,
      [userId, mediaItemId]
    );

    res.status(201).json({ success: true, message: 'به علاقه‌مندی‌ها اضافه شد', isFavorite: true });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/**
 * @route   DELETE /api/content/:id/favorite
 * @desc    حذف از علاقه‌مندی‌ها
 * @access  Private
 */
exports.removeFavorite = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const mediaItemId = req.params.id;

    await client.query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND media_item_id = $2',
      [userId, mediaItemId]
    );

    res.json({ success: true, message: 'از علاقه‌مندی‌ها حذف شد', isFavorite: false });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════
// SAVED / BOOKMARKS (ذخیره‌شده‌ها)
// ═══════════════════════════════════════════════════════

/**
 * @route   GET /api/content/saved
 * @desc    دریافت لیست ذخیره‌شده‌های کاربر
 * @access  Private
 */
exports.getSavedItems = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // جدول user_saved_items اگر وجود ندارد، باید ایجاد شود (migration زیر)
    const query = `
      SELECT
        us.id,
        us.user_id,
        us.media_item_id,
        us.note,
        us.created_at,
        m.title,
        m.description,
        m.file_url,
        m.thumbnail_url,
        m.duration,
        m.difficulty_level,
        m.language,
        m.tags,
        m.view_count,
        m.like_count,
        m.published_at,
        mt.name_fa AS media_type_name,
        mt.icon    AS media_type_icon,
        cs.source_name,
        cs.source_type
      FROM user_saved_items us
      JOIN media_items m ON us.media_item_id = m.id
      LEFT JOIN media_types mt ON m.media_type_id = mt.id
      LEFT JOIN content_sources cs ON m.content_source_id = cs.id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total FROM user_saved_items WHERE user_id = $1
    `;

    const [result, countResult] = await Promise.all([
      client.query(query, [userId, limit, offset]),
      client.query(countQuery, [userId])
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        mediaItemId: row.media_item_id,
        note: row.note,
        createdAt: row.created_at,
        mediaItem: mapMediaItem(row)
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/**
 * @route   POST /api/content/:id/save
 * @desc    ذخیره کردن محتوا (بوک‌مارک)
 * @access  Private
 */
exports.saveItem = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const mediaItemId = req.params.id;
    const { note } = req.body;

    // بررسی وجود محتوا
    const exists = await client.query(
      'SELECT id FROM media_items WHERE id = $1 AND is_published = true',
      [mediaItemId]
    );
    if (exists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'محتوا یافت نشد' });
    }

    await client.query(
      `INSERT INTO user_saved_items (user_id, media_item_id, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, media_item_id)
       DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()`,
      [userId, mediaItemId, note || null]
    );

    res.status(201).json({ success: true, message: 'ذخیره شد', isSaved: true });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

/**
 * @route   DELETE /api/content/:id/save
 * @desc    حذف از ذخیره‌شده‌ها
 * @access  Private
 */
exports.removeSavedItem = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const mediaItemId = req.params.id;

    await client.query(
      'DELETE FROM user_saved_items WHERE user_id = $1 AND media_item_id = $2',
      [userId, mediaItemId]
    );

    res.json({ success: true, message: 'از ذخیره‌شده‌ها حذف شد', isSaved: false });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════
function mapMediaItem(row) {
  return {
    id: row.media_item_id || row.id,
    title: row.title,
    description: row.description,
    file_url: row.file_url,
    thumbnail_url: row.thumbnail_url,
    duration: row.duration,
    difficulty_level: row.difficulty_level,
    language: row.language,
    tags: row.tags || [],
    view_count: row.view_count || 0,
    like_count: row.like_count || 0,
    published_at: row.published_at,
    media_type_name: row.media_type_name,
    media_type_icon: row.media_type_icon,
    source_name: row.source_name,
    source_type: row.source_type
  };
}
