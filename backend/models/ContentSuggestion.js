module.exports = (sequelize, DataTypes) => {
  const ContentSuggestion = sequelize.define('ContentSuggestion', {
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
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    suggestedMediaType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'suggested_media_type'
    },
    suggestedCompetencies: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      field: 'suggested_competencies'
    },
    priority: {
      type: DataTypes.STRING(50),
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']]
      }
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'under_review', 'approved', 'rejected', 'implemented']]
      }
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_notes'
    },
    implementedContentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'implemented_content_id',
      references: {
        model: 'contents',
        key: 'id'
      }
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    downvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'content_suggestions',
    timestamps: true,
    underscored: true
  });

  ContentSuggestion.associate = (models) => {
    ContentSuggestion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'suggestedBy'
    });
    ContentSuggestion.belongsTo(models.User, {
      foreignKey: 'reviewedBy',
      as: 'reviewer'
    });
    ContentSuggestion.belongsTo(models.Content, {
      foreignKey: 'implementedContentId',
      as: 'implementedContent'
    });
  };

  return ContentSuggestion;
};
