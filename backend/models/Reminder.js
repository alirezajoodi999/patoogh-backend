module.exports = (sequelize, DataTypes) => {
  const Reminder = sequelize.define('Reminder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'content_id',
      references: {
        model: 'contents',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminderType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'reminder_type',
      validate: {
        isIn: [['content', 'competency', 'deadline', 'custom']]
      }
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'scheduled_at'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at'
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'sent', 'failed', 'cancelled']]
      }
    },
    repeatInterval: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'repeat_interval',
      validate: {
        isIn: [['daily', 'weekly', 'monthly', 'none']]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'reminders',
    timestamps: true,
    underscored: true
  });

  Reminder.associate = (models) => {
    Reminder.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Reminder.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'content'
    });
  };

  return Reminder;
};
