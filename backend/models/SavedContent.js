const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SavedContent extends Model {
    static associate(models) {
      SavedContent.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      SavedContent.belongsTo(models.Content, {
        foreignKey: 'contentId',
        as: 'content'
      });
    }
  }

  SavedContent.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'contents', key: 'id' }
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SavedContent',
    tableName: 'saved_contents',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'content_id'] // ✅ اصلاح: استفاده از نام ستون‌های دیتابیز
      }
    ]
  });

  return SavedContent;
};