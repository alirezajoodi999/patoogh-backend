const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Comment.belongsTo(models.Content, {
        foreignKey: 'contentId',
        as: 'content'
      });
      Comment.belongsTo(models.Comment, {
        foreignKey: 'parentId',
        as: 'parent'
      });
      Comment.hasMany(models.Comment, {
        foreignKey: 'parentId',
        as: 'replies'
      });
      // برای لایک (بسیاری از کاربران می‌توانند یک کامنت را لایک کنند)
      Comment.belongsToMany(models.User, {
        through: 'CommentLikes',
        foreignKey: 'commentId',
        otherKey: 'userId',
        as: 'likedBy'
      });
    }
  }

  Comment.init({
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
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'comments', key: 'id' }
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { len: [1, 2000] }
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true
  });

  return Comment;
};