const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
  }
);

async function fixMigration() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) 
      VALUES ('20260503193003-add-email-verification-fields.js')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Migration marked as executed');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMigration();
