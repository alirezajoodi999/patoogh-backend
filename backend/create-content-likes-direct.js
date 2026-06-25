// create-content-likes-direct.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createContentLikesTable() {
  const client = await pool.connect();
  try {
    console.log(`Connected to: ${process.env.DB_NAME}\n`);
    
    // Create content_likes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE ON UPDATE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, content_id)
      );
    `);
    
    console.log('✓ Table content_likes created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS content_likes_user_id_idx ON content_likes(user_id);
    `);
    console.log('✓ Index content_likes_user_id_idx created');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS content_likes_content_id_idx ON content_likes(content_id);
    `);
    console.log('✓ Index content_likes_content_id_idx created');
    
    // Verify table was created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'content_likes';
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✓ Table content_likes verified in database');
    } else {
      console.log('\n✗ Table content_likes NOT found after creation');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createContentLikesTable();
