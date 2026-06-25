module.exports = (sequelize, DataTypes) => {
  const Content = sequelize.define('Content', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mediaTypeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'media_type_id',
      references: {
        model: 'media_types',
        key: 'id'
      }
    },
    contentSourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'content_source_id',
      references: {
        model: 'content_sources',
        key: 'id'
      }
    },
    fileUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'file_url'
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'file_type'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds'
    },
    thumbnailUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'thumbnail_url'
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'fa'
    },
    difficultyLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'difficulty_level',
      validate: {
        isIn: [['beginner', 'intermediate', 'advanced', 'expert']]
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'like_count'
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      field: 'average_rating'
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // ─── فیلدهای اضافه شده بر اساس مستندات پاتوق ───
    // وزن آموزشی محتوا (صفحه ۱۱ مستندات): میزان اهمیت و عمق یادگیری
    weight: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'وزن آموزشی محتوا از ۱ تا ۵ - بر اساس مستندات پاتوق'
    },
    // سال انتشار محتوا - برای نمایش در جدول بانک محتوا (صفحه ۱۲)
    publicationYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'publication_year',
      comment: 'سال انتشار محتوا (شمسی)'
    },
    // وضعیت تأیید محتوا قبل از انتشار (صفحه ۲۲ مستندات)
    approvalStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'draft',
      field: 'approval_status',
      validate: {
        isIn: [['draft', 'pending_review', 'approved', 'rejected', 'archived']]
      },
      comment: 'وضعیت تأیید محتوا: پیش‌نویس، در انتظار بررسی، تأیید شده، رد شده، آرشیو'
    },
    // نسخه محتوا برای پشتیبانی از versioning (صفحه ۲۲)
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    }
  }, {
    tableName: 'contents',
    timestamps: true,
    underscored: true
  });

  Content.associate = (models) => {
    Content.belongsTo(models.MediaType, {
      foreignKey: 'mediaTypeId',
      as: 'mediaType'
    });
    Content.belongsTo(models.ContentSource, {
      foreignKey: 'contentSourceId',
      as: 'contentSource'
    });
    Content.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    Content.belongsToMany(models.Competency, {
      through: 'competency_content_map',
      foreignKey: 'contentId',
      otherKey: 'competencyId',
      as: 'competencies'
    });
    Content.hasMany(models.ContentEvaluation, {
      foreignKey: 'contentId',
      as: 'evaluations'
    });
    Content.hasMany(models.UserProgress, {
      foreignKey: 'contentId',
      as: 'userProgress'
    });
  };

  return Content;
};
