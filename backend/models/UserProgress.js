const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProgress extends Model {
    static associate(models) {
      UserProgress.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      UserProgress.belongsTo(models.Competency, {
        foreignKey: 'competencyId',
        as: 'competency'
      });
    }
  }

  UserProgress.init({
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
    competencyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'competencies', key: 'id' }
    },
    currentLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0, max: 5 }
    },
    targetLevel: {
      type: DataTypes.INTEGER,
      validate: { min: 0, max: 5 }
    },
    lastAssessedAt: DataTypes.DATE,
    completedContents: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    achievements: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    learningPath: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    totalLearningTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'UserProgress',
    tableName: 'user_progresses',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'competency_id'] // ✅ اصلاح: snake_case
      }
    ]
  });

  return UserProgress;
};