const { sequelize } = require('./models');

async function checkTable() {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_likes';"
    );
    
    console.log('Results:', results);
    console.log('Metadata:', metadata);
    
    if (!results || results.length === 0) {
      console.log('\n❌ Table content_likes does NOT exist in database');
    } else {
      console.log('\n✅ Table content_likes EXISTS in database');
    }
    
    // بررسی تمام جداول موجود
    const [allTables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    
    console.log('\n📋 All tables in database:');
    allTables.forEach(table => {
      console.log('  -', table.table_name);
    });
    
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTable();
