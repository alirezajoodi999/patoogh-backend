const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// بارگذاری متغیرهای محیطی
require('dotenv').config();

const db = {};

// ساخت اتصال به دیتابیس
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    define: { timestamps: true, underscored: true },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'patoogh_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: process.env.DB_DIALECT || 'postgres',
      logging: false,
      define: { timestamps: true, underscored: true },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// بارگذاری مدل‌ها
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// برقراری ارتباطات (associations)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ایجاد pool از sequelize برای استفاده در health check
const pool = {
  query: async (text, params) => {
    return sequelize.query(text, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT
    });
  },
  end: async () => {
    await sequelize.close();
  }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.pool = pool;
db.query = (text, params) => pool.query(text, params);

module.exports = db;