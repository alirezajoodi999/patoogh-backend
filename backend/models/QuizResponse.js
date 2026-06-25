const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class QuizResponse extends Model {
    static associate(models) {
      QuizResponse.belongsTo(models.ContentQuiz, {
        foreignKey: 'quizId',
        as: 'quiz'
      });
      QuizResponse.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  QuizResponse.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'content_quizzes', key: 'id' }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      validate: { min: 0, max: 100 }
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    timeSpent: DataTypes.INTEGER,
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'QuizResponse',
    tableName: 'quiz_responses',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['quiz_id', 'user_id'] // ✅ اصلاح: استفاده از نام ستون‌های دیتابیز
      }
    ]
  });

  return QuizResponse;
};