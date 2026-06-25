const { pool } = require('./config/database');

async function checkCompetenciesTable() {
  try {
    // بررسی وجود جدول
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'competencies'
      );
    `);
    
    console.log('✓ جدول competencies وجود دارد:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // بررسی ستون‌های جدول
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'competencies'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n✓ ستون‌های جدول competencies:');
      columnsCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // بررسی تعداد رکوردها
      const countCheck = await pool.query('SELECT COUNT(*) FROM competencies');
      console.log(`\n✓ تعداد رکوردها: ${countCheck.rows[0].count}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('✗ خطا:', error.message);
    process.exit(1);
  }
}

checkCompetenciesTable();
