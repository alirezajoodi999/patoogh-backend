const pool = require('./db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function createAdmin() {
  const id = crypto.randomUUID(); 
  const email = 'admin@patoogh.com';
  const password = 'AdminPassword123!';
  const fullName = 'مدیر سیستم پاتوق';
  const role = 'admin';

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // اضافه کردن ستون‌های created_at و updated_at به کوئری با مقدار NOW()
    const queryText = `
      INSERT INTO users (id, email, password_hash, full_name, role, is_active, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
      RETURNING id, email, role;
    `;

    const values = [id, email, passwordHash, fullName, role];
    const res = await pool.query(queryText, values);
    
    console.log('✅ کاربر ادمین با موفقیت ساخته شد:');
    console.log(res.rows[0]);
  } catch (err) {
    console.error('❌ خطا در ساخت کاربر ادمین:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
