// models/ContentEvaluation.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ContentEvaluation extends Model {
    static associate(models) {
      ContentEvaluation.belongsTo(models.Content, {
        foreignKey: 'contentId',
        as: 'content'
      });
      ContentEvaluation.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  ContentEvaluation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'contents', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ContentEvaluation',
    tableName: 'content_evaluations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['content_id', 'user_id'] // ✅ اصلاح: snake_case
      }
    ]
  });

  return ContentEvaluation;
};