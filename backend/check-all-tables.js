// check-all-tables.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkTables() {
  const client = await pool.connect();
  try {
    console.log(`Connected to: ${process.env.DB_NAME}\n`);
    
    // Get all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('All tables in database:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check if users table exists
    const usersExists = tables.rows.some(row => row.table_name === 'users');
    console.log(`\nusers table exists: ${usersExists}`);
    
    if (usersExists) {
      const usersStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      console.log('\nusers table structure:');
      console.log(usersStructure.rows);
    }
    
    // Check if contents table exists
    const contentsExists = tables.rows.some(row => row.table_name === 'contents');
    console.log(`\ncontents table exists: ${contentsExists}`);
    
    if (contentsExists) {
      const contentsStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'contents'
        ORDER BY ordinal_position;
      `);
      console.log('\ncontents table structure:');
      console.log(contentsStructure.rows);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
