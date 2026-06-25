// backend/models/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
      },
      onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'new_content',
          'reminder',
          'evaluation_request',
          'suggestion_update',
          'achievement',
          'system',
          'message'
        ]]
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
    relatedEntityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'related_entity_type',
      comment: 'content, competency, suggestion, reminder, etc.'
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'related_entity_id'
    },
    actionUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'action_url',
      comment: 'URL for action button in notification'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
      comment: 'Notification will be auto-deleted after this date'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional data for notification'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'is_read']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['type']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  Notification.prototype.markAsRead = async function() {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
  };

  Notification.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  };

  // Class methods
  Notification.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        userId,
        isRead: false
      }
    });
  };

  Notification.markAllAsReadForUser = async function(userId) {
    return await this.update(
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { 
        where: { 
          userId, 
          isRead: false 
        } 
      }
    );
  };

  Notification.deleteExpired = async function() {
    const { Op } = require('sequelize');
    return await this.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });
  };

  return Notification;
};
