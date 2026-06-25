const { pool } = require('../config/database');

/**
 * @desc    دریافت لیست تمام انواع رسانه‌ها از دیتابیس
 * @route   GET /api/content/media-types
 * @access  Public
 */
const getMediaTypes = async (req, res) => {
  try {
    const query = 'SELECT * FROM media_types ORDER BY name_fa ASC';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching media types:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت انواع رسانه',
      error: error.message 
    });
  }
};

// Get all content with filters
const getAllContent = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    
    const { 
      type, 
      competency_id, 
      search, 
      sort = 'created_at', 
      order = 'DESC',
      limit = 20,
      offset = 0 
    } = req.query;

    let query = `
      SELECT 
        c.*,
        mt.name_fa as media_type_name_fa,
        mt.name_en as media_type_name_en,
        mt.id as media_type_id,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', comp.id,
              'name_fa', comp.name_fa,
              'name_en', comp.name_en,
              'description', comp.description
            )
          ) FILTER (WHERE comp.id IS NOT NULL),
          '[]'
        ) as competencies,
        COUNT(DISTINCT l.user_id) as like_count
    `;

    if (userId) {
      query += `,
        EXISTS(
          SELECT 1 FROM user_favorites uf 
          WHERE uf.content_id = c.id AND uf.user_id = $1
        ) as is_favorite,
        EXISTS(
          SELECT 1 FROM content_likes cl 
          WHERE cl.content_id = c.id AND cl.user_id = $1
        ) as is_liked
      `;
    } else {
      query += `,
        false as is_favorite,
        false as is_liked
      `;
    }

    query += `
      FROM contents c
      LEFT JOIN media_types mt ON c.media_type_id = mt.id
      LEFT JOIN competency_content_map ccm ON c.id = ccm.content_id
      LEFT JOIN competencies comp ON ccm.competency_id = comp.id
      LEFT JOIN content_likes l ON c.id = l.content_id
      WHERE 1=1
    `;

    const params = userId ? [userId] : [];
    let paramCount = userId ? 1 : 0;

    if (type) {
      paramCount++;
      query += ` AND c.media_type_id = $${paramCount}`;
      params.push(type);
    }

    if (competency_id) {
      paramCount++;
      query += ` AND comp.id = $${paramCount}`;
      params.push(competency_id);
    }

    if (search) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY c.id, mt.id, mt.name_fa, mt.name_en`;
    query += ` ORDER BY c.${sort} ${order}`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rowCount
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت محتوا',
      error: error.message 
    });
  }
};

// Get single content by ID
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    let query = `
      SELECT 
        c.*,
        mt.name_fa as media_type_name_fa,
        mt.name_en as media_type_name_en,
        mt.id as media_type_id,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', comp.id,
              'name_fa', comp.name_fa,
              'name_en', comp.name_en,
              'description', comp.description
            )
          ) FILTER (WHERE comp.id IS NOT NULL),
          '[]'
        ) as competencies,
        COUNT(DISTINCT l.user_id) as like_count
    `;

    if (userId) {
      query += `,
        EXISTS(
          SELECT 1 FROM user_favorites uf 
          WHERE uf.content_id = c.id AND uf.user_id = $2
        ) as is_favorite,
        EXISTS(
          SELECT 1 FROM content_likes cl 
          WHERE cl.content_id = c.id AND cl.user_id = $2
        ) as is_liked
      `;
    } else {
      query += `,
        false as is_favorite,
        false as is_liked
      `;
    }

    query += `
      FROM contents c
      LEFT JOIN media_types mt ON c.media_type_id = mt.id
      LEFT JOIN competency_content_map ccm ON c.id = ccm.content_id
      LEFT JOIN competencies comp ON ccm.competency_id = comp.id
      LEFT JOIN content_likes l ON c.id = l.content_id
      WHERE c.id = $1
      GROUP BY c.id, mt.id, mt.name_fa, mt.name_en
    `;

    const params = userId ? [id, userId] : [id];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'محتوا یافت نشد' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت محتوا',
      error: error.message 
    });
  }
};

// Create new content
const createContent = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { 
      title, 
      description, 
      media_type_id,
      file_url,
      file_type,
      file_size,
      thumbnail_url, 
      duration,
      language,
      difficulty_level,
      tags,
      competency_ids = [],
      // فیلدهای جدید بر اساس مستندات پاتوق
      weight = 1,             // وزن آموزشی (۱ تا ۵)
      publication_year,       // سال انتشار (شمسی)
      approval_status = 'draft'  // وضعیت تأیید
    } = req.body;

    if (!title || !media_type_id || !file_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'عنوان، نوع رسانه و URL فایل الزامی هستند' 
      });
    }

    // اعتبارسنجی وزن محتوا
    if (weight && (weight < 1 || weight > 5)) {
      return res.status(400).json({
        success: false,
        message: 'وزن محتوا باید بین ۱ تا ۵ باشد'
      });
    }

    const insertQuery = `
      INSERT INTO contents (
        title, description, media_type_id, file_url, file_type, 
        file_size, thumbnail_url, duration, language, difficulty_level, 
        tags, created_by, weight, publication_year, approval_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      title,
      description,
      media_type_id,
      file_url,
      file_type,
      file_size,
      thumbnail_url,
      duration,
      language,
      difficulty_level,
      tags,
      req.user.id,
      weight || 1,
      publication_year || null,
      approval_status || 'draft'
    ]);

    const content = result.rows[0];

    if (competency_ids.length > 0) {
      // competency_ids می‌تواند آرایه‌ای از آبجکت‌ها باشد: [{id, weight}] یا آرایه‌ای از رشته‌ها
      const mappings = competency_ids.map(item => {
        if (typeof item === 'object' && item.id) {
          return { comp_id: item.id, comp_weight: item.weight || 1 };
        }
        return { comp_id: item, comp_weight: 1 };
      });

      const mapQuery = `
        INSERT INTO competency_content_map (competency_id, content_id, weight)
        VALUES ${mappings.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ')}
        ON CONFLICT (competency_id, content_id) DO UPDATE SET weight = EXCLUDED.weight
      `;
      
      const mapParams = mappings.flatMap(m => [m.comp_id, content.id, m.comp_weight]);
      await client.query(mapQuery, mapParams);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'محتوا با موفقیت ایجاد شد',
      data: content
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در ایجاد محتوا',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Update content
const updateContent = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { 
      title, 
      description, 
      media_type_id,
      file_url,
      file_type,
      file_size,
      thumbnail_url, 
      duration,
      language,
      difficulty_level,
      tags,
      competency_ids 
    } = req.body;

    const checkQuery = 'SELECT * FROM contents WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'محتوا یافت نشد' 
      });
    }

    const updateQuery = `
      UPDATE contents 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        media_type_id = COALESCE($3, media_type_id),
        file_url = COALESCE($4, file_url),
        file_type = COALESCE($5, file_type),
        file_size = COALESCE($6, file_size),
        thumbnail_url = COALESCE($7, thumbnail_url),
        duration = COALESCE($8, duration),
        language = COALESCE($9, language),
        difficulty_level = COALESCE($10, difficulty_level),
        tags = COALESCE($11, tags),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      title,
      description,
      media_type_id,
      file_url,
      file_type,
      file_size,
      thumbnail_url,
      duration,
      language,
      difficulty_level,
      tags,
      id
    ]);

    if (competency_ids) {
      await client.query('DELETE FROM competency_content_map WHERE content_id = $1', [id]);

      if (competency_ids.length > 0) {
        const mapQuery = `
          INSERT INTO competency_content_map (competency_id, content_id)
          VALUES ${competency_ids.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
        `;
        
        const mapParams = competency_ids.flatMap(comp_id => [comp_id, id]);
        await client.query(mapQuery, mapParams);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'محتوا با موفقیت به‌روزرسانی شد',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در به‌روزرسانی محتوا',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Delete content
const deleteContent = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const checkQuery = 'SELECT * FROM contents WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'محتوا یافت نشد' 
      });
    }

    await client.query('DELETE FROM competency_content_map WHERE content_id = $1', [id]);
    await client.query('DELETE FROM user_favorites WHERE content_id = $1', [id]);
    await client.query('DELETE FROM content_likes WHERE content_id = $1', [id]);
    await client.query('DELETE FROM contents WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'محتوا با موفقیت حذف شد'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در حذف محتوا',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Toggle favorite
const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkQuery = 'SELECT * FROM user_favorites WHERE user_id = $1 AND content_id = $2';
    const checkResult = await pool.query(checkQuery, [userId, id]);

    if (checkResult.rows.length > 0) {
      await pool.query('DELETE FROM user_favorites WHERE user_id = $1 AND content_id = $2', [userId, id]);
      
      res.json({
        success: true,
        message: 'محتوا از علاقه‌مندی‌ها حذف شد',
        is_favorite: false
      });
    } else {
      await pool.query(
        'INSERT INTO user_favorites (user_id, content_id) VALUES ($1, $2)',
        [userId, id]
      );
      
      res.json({
        success: true,
        message: 'محتوا به علاقه‌مندی‌ها اضافه شد',
        is_favorite: true
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در تغییر وضعیت علاقه‌مندی',
      error: error.message 
    });
  }
};

// Get user favorites
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        c.*,
        mt.name_fa as media_type_name_fa,
        mt.name_en as media_type_name_en,
        mt.id as media_type_id,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', comp.id,
              'name_fa', comp.name_fa,
              'name_en', comp.name_en,
              'description', comp.description
            )
          ) FILTER (WHERE comp.id IS NOT NULL),
          '[]'
        ) as competencies,
        COUNT(DISTINCT l.user_id) as like_count,
        true as is_favorite,
        EXISTS(
          SELECT 1 FROM content_likes cl 
          WHERE cl.content_id = c.id AND cl.user_id = $1
        ) as is_liked
      FROM contents c
      INNER JOIN user_favorites uf ON c.id = uf.content_id
      LEFT JOIN media_types mt ON c.media_type_id = mt.id
      LEFT JOIN competency_content_map ccm ON c.id = ccm.content_id
      LEFT JOIN competencies comp ON ccm.competency_id = comp.id
      LEFT JOIN content_likes l ON c.id = l.content_id
      WHERE uf.user_id = $1
      GROUP BY c.id, mt.id, mt.name_fa, mt.name_en, uf.created_at
      ORDER BY uf.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت علاقه‌مندی‌ها',
      error: error.message 
    });
  }
};

// Like content
const likeContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkQuery = 'SELECT * FROM content_likes WHERE user_id = $1 AND content_id = $2';
    const checkResult = await pool.query(checkQuery, [userId, id]);

    if (checkResult.rows.length > 0) {
      await pool.query('DELETE FROM content_likes WHERE user_id = $1 AND content_id = $2', [userId, id]);
      
      res.json({
        success: true,
        message: 'لایک حذف شد',
        is_liked: false
      });
    } else {
      await pool.query(
        'INSERT INTO content_likes (user_id, content_id) VALUES ($1, $2)',
        [userId, id]
      );
      
      res.json({
        success: true,
        message: 'محتوا لایک شد',
        is_liked: true
      });
    }
  } catch (error) {
    console.error('Error liking content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در لایک محتوا',
      error: error.message 
    });
  }
};

// Search content
const searchContent = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { q, type, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'پارامتر جستجو الزامی است' 
      });
    }

    let query = `
      SELECT 
        c.*,
        mt.name_fa as media_type_name_fa,
        mt.name_en as media_type_name_en,
        mt.id as media_type_id,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', comp.id,
              'name_fa', comp.name_fa,
              'name_en', comp.name_en,
              'description', comp.description
            )
          ) FILTER (WHERE comp.id IS NOT NULL),
          '[]'
        ) as competencies,
        COUNT(DISTINCT l.user_id) as like_count
    `;

    if (userId) {
      query += `,
        EXISTS(
          SELECT 1 FROM user_favorites uf 
          WHERE uf.content_id = c.id AND uf.user_id = $1
        ) as is_favorite,
        EXISTS(
          SELECT 1 FROM content_likes cl 
          WHERE cl.content_id = c.id AND cl.user_id = $1
        ) as is_liked
      `;
    } else {
      query += `,
        false as is_favorite,
        false as is_liked
      `;
    }

    query += `
      FROM contents c
      LEFT JOIN media_types mt ON c.media_type_id = mt.id
      LEFT JOIN competency_content_map ccm ON c.id = ccm.content_id
      LEFT JOIN competencies comp ON ccm.competency_id = comp.id
      LEFT JOIN content_likes l ON c.id = l.content_id
      WHERE (c.title ILIKE $${userId ? 2 : 1} OR c.description ILIKE $${userId ? 2 : 1})
    `;

    const params = userId ? [userId, `%${q}%`] : [`%${q}%`];
    let paramCount = params.length;

    if (type) {
      paramCount++;
      query += ` AND c.media_type_id = $${paramCount}`;
      params.push(type);
    }

    paramCount++;
    query += ` GROUP BY c.id, mt.id, mt.name_fa, mt.name_en ORDER BY c.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در جستجوی محتوا',
      error: error.message 
    });
  }
};

// Get content by competency
const getContentByCompetency = async (req, res) => {
  try {
    const { competency_id } = req.params;
    const userId = req.user?.id || null;

    let query = `
      SELECT 
        c.*,
        mt.name_fa as media_type_name_fa,
        mt.name_en as media_type_name_en,
        mt.id as media_type_id,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', comp.id,
              'name_fa', comp.name_fa,
              'name_en', comp.name_en,
              'description', comp.description
            )
          ) FILTER (WHERE comp.id IS NOT NULL),
          '[]'
        ) as competencies,
        COUNT(DISTINCT l.user_id) as like_count
    `;

    if (userId) {
      query += `,
        EXISTS(
          SELECT 1 FROM user_favorites uf 
          WHERE uf.content_id = c.id AND uf.user_id = $1
        ) as is_favorite,
        EXISTS(
          SELECT 1 FROM content_likes cl 
          WHERE cl.content_id = c.id AND cl.user_id = $1
        ) as is_liked
      `;
    } else {
      query += `,
        false as is_favorite,
        false as is_liked
      `;
    }

    query += `
      FROM contents c
      INNER JOIN competency_content_map ccm ON c.id = ccm.content_id
      LEFT JOIN media_types mt ON c.media_type_id = mt.id
      LEFT JOIN competencies comp ON ccm.competency_id = comp.id
      LEFT JOIN content_likes l ON c.id = l.content_id
      WHERE ccm.competency_id = $${userId ? 2 : 1}
      GROUP BY c.id, mt.id, mt.name_fa, mt.name_en
      ORDER BY c.created_at DESC
    `;

    const params = userId ? [userId, competency_id] : [competency_id];
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching content by competency:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت محتوای شایستگی',
      error: error.message 
    });
  }
};

module.exports = {
  getMediaTypes, // 👈 اضافه شدن تابع دریافت انواع رسانه‌ها در لیست اکسپورت
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  toggleFavorite,
  getUserFavorites,
  likeContent,
  searchContent,
  getContentByCompetency
};
