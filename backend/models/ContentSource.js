module.exports = (sequelize, DataTypes) => {
  const ContentSource = sequelize.define('ContentSource', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'source_type',
      validate: {
        isIn: [[
          'internal_expert',
          'employee_experience',
          'archive',
          'outsourced',
          'external_course',
          'educational_institution',
          'digital_tool',
          'social_network'
        ]]
      }
    },
    sourceName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'source_name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isExternal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_external'
    },
    contactInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'contact_info',
      comment: 'JSON with email, phone, website, etc.'
    },
    websiteUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'website_url'
    },
    contractDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'contract_details'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'content_sources',
    timestamps: true,
    underscored: true
  });

  ContentSource.associate = (models) => {
    ContentSource.hasMany(models.Content, {
      foreignKey: 'contentSourceId',
      as: 'contents'
    });
  };

  return ContentSource;
};
