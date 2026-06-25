const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Competency extends Model {
    static associate(models) {
      Competency.belongsToMany(models.Content, {
        through: 'ContentCompetencies',
        foreignKey: 'competencyId',
        otherKey: 'contentId',
        as: 'contents'
      });
      Competency.hasMany(models.UserProgress, {
        foreignKey: 'competencyId',
        as: 'userProgresses'
      });
      Competency.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
    }
  }

  Competency.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.ENUM('individual', 'interaction', 'management', 'leadership', 'strategic'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // سطوح شایستگی (ذخیره به‌صورت JSON)
    proficiencyLevels: {
      type: DataTypes.JSONB, // یا JSON
      allowNull: false,
      defaultValue: []
      /*
        مثال:
        [
          { level: 1, title: 'آشنایی', description: '...', behavioralIndicators: [{ type: 'positive', description: '...' }] },
          ...
        ]
      */
    },
    // نقش‌های سازمانی (ذخیره به‌صورت JSON)
    organizationalRoles: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
      /*
        مثال:
        [
          { roleId: 'uuid', requiredLevel: 3 }
        ]
      */
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Competency',
    tableName: 'competencies',
    timestamps: true
  });

  return Competency;
};