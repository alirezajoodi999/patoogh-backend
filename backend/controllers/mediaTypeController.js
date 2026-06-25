const { pool } = require('../models');

/**
 * Get all media types
 */
const getAllMediaTypes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM media_types WHERE is_active = true ORDER BY display_order, created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching media types:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت انواع رسانه'
    });
  }
};

/**
 * Get media type by ID
 */
const getMediaTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM media_types WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'نوع رسانه یافت نشد'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching media type:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت نوع رسانه'
    });
  }
};

/**
 * Create new media type
 */
const createMediaType = async (req, res) => {
  try {
    const { name_fa, name_en, description, icon, display_order, is_active } = req.body;

    console.log('Request body:', req.body);

    // Validation
    if (!name_fa) {
      return res.status(400).json({
        success: false,
        message: 'نام فارسی الزامی است'
      });
    }

    const result = await pool.query(
      `INSERT INTO media_types (name_fa, name_en, description, icon, display_order, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        name_fa,
        name_en || null,
        description || null,
        icon || null,
        display_order || 0,
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'نوع رسانه با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating media type:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد نوع رسانه',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update media type
 */
const updateMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_fa, name_en, description, icon, display_order, is_active } = req.body;

    console.log('Update request - ID:', id, 'Body:', req.body);

    // Validation
    if (!name_fa) {
      return res.status(400).json({
        success: false,
        message: 'نام فارسی الزامی است'
      });
    }

    const result = await pool.query(
      `UPDATE media_types 
       SET name_fa = $1, name_en = $2, description = $3, icon = $4, 
           display_order = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        name_fa,
        name_en || null,
        description || null,
        icon || null,
        display_order || 0,
        is_active !== undefined ? is_active : true,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'نوع رسانه یافت نشد'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'نوع رسانه با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating media type:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی نوع رسانه',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete media type (soft delete)
 */
const deleteMediaType = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Delete request - ID:', id);

    const result = await pool.query(
      `UPDATE media_types 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'نوع رسانه یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'نوع رسانه با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting media type:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف نوع رسانه',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllMediaTypes,
  getMediaTypeById,
  createMediaType,
  updateMediaType,
  deleteMediaType
};
