const { pool } = require('../models');

/**
 * Get all content sources
 */
const getAllContentSources = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM content_sources ORDER BY source_name'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching content sources:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت منابع محتوا'
    });
  }
};

/**
 * Get content source by ID
 */
const getContentSourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM content_sources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'منبع محتوا یافت نشد'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching content source:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت منبع محتوا'
    });
  }
};

/**
 * Create new content source
 */
const createContentSource = async (req, res) => {
  try {
    const { source_type, source_name, description, is_external, contact_info, website_url } = req.body;

    const result = await pool.query(
      `INSERT INTO content_sources (source_type, source_name, description, is_external, contact_info, website_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [source_type, source_name, description, is_external, contact_info, website_url]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'منبع محتوا با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating content source:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد منبع محتوا'
    });
  }
};

/**
 * Update content source
 */
const updateContentSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { source_type, source_name, description, is_external, contact_info, website_url } = req.body;

    const result = await pool.query(
      `UPDATE content_sources 
       SET source_type = $1, source_name = $2, description = $3, is_external = $4, contact_info = $5, website_url = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [source_type, source_name, description, is_external, contact_info, website_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'منبع محتوا یافت نشد'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'منبع محتوا با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating content source:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی منبع محتوا'
    });
  }
};

/**
 * Delete content source
 */
const deleteContentSource = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM content_sources WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'منبع محتوا یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'منبع محتوا با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting content source:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف منبع محتوا'
    });
  }
};

module.exports = {
  getAllContentSources,
  getContentSourceById,
  createContentSource,
  updateContentSource,
  deleteContentSource
};
