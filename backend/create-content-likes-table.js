// create-content-likes-table.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createTable() {
  const client = await pool.connect();
  try {
    console.log(`Connected to database: ${process.env.DB_NAME}`);
    
    // Check if table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content_likes'
      );
    `);
    
    console.log('Table exists:', checkTable.rows[0].exists);
    
    if (!checkTable.rows[0].exists) {
      console.log('Creating content_likes table...');
      
      await client.query(`
        CREATE TABLE "content_likes" (
          "id" SERIAL PRIMARY KEY,
          "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "content_id" INTEGER NOT NULL REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE("user_id", "content_id")
        );
      `);
      
      console.log('✓ Table created successfully');
    } else {
      console.log('Table already exists');
    }
    
    // Verify
    const verify = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'content_likes'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    console.log(verify.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTable();
