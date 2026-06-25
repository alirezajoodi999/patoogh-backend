const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'full_name'
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // نقش‌های سیستم بر اساس مستندات پاتوق:
      // 'manager'  → مدیران سازمان (کاربران اصلی - مشاهده محتوا، ارزیابی، پروفایل)
      // 'hr_admin' → ادمین آموزش و توسعه (مدیریت محتوا، شایستگی‌ها، گزارش‌ها)
      // 'admin'    → ادمین فنی (مدیریت کامل سیستم، کاربران، امنیت)
      defaultValue: 'manager',
      validate: {
        isIn: [['admin', 'hr_admin', 'manager']]
      }
    },
    department: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    position: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'avatar_url'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    verificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'verification_token'
    },
    verificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_token_expires'
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reset_password_token'
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_expires'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  };

  User.associate = (models) => {
    User.hasMany(models.Content, {
      foreignKey: 'createdBy',
      as: 'createdContent'
    });
    User.hasMany(models.UserProgress, {
      foreignKey: 'userId',
      as: 'progress'
    });
    User.hasMany(models.ContentEvaluation, {
      foreignKey: 'userId',
      as: 'evaluations'
    });
    User.hasMany(models.Reminder, {
      foreignKey: 'userId',
      as: 'reminders'
    });
    User.hasMany(models.Notification, {
      foreignKey: 'userId',
      as: 'notifications'
    });
    User.hasMany(models.ContentSuggestion, {
      foreignKey: 'userId',
      as: 'suggestions'
    });
  };

  return User;
};
