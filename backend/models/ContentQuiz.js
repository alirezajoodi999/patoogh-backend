const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ContentQuiz extends Model {
    static associate(models) {
      ContentQuiz.belongsTo(models.Content, {
        foreignKey: 'contentId',
        as: 'content'
      });
      ContentQuiz.hasMany(models.QuizResponse, {
        foreignKey: 'quizId',
        as: 'responses',
        onDelete: 'CASCADE'
      });
      ContentQuiz.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }

  ContentQuiz.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'contents', key: 'id' }
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: 'Quick Assessment'
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: false
      /*
        مثال:
        [
          { question: '...', options: ['a','b','c'], correctAnswer: 0, explanation: '...' }
        ]
      */
    },
    passingScore: {
      type: DataTypes.INTEGER,
      defaultValue: 70,
      validate: { min: 0, max: 100 }
    },
    timeLimit: DataTypes.INTEGER, // دقیقه
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'ContentQuiz',
    tableName: 'content_quizzes',
    timestamps: true
  });

  return ContentQuiz;
};