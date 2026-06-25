module.exports = (sequelize, DataTypes) => {
  const MediaType = sequelize.define('MediaType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nameFa: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'name_fa'
    },
    nameEn: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'name_en'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'display_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'media_types',
    timestamps: true,
    underscored: true
  });

  MediaType.associate = (models) => {
    MediaType.hasMany(models.Content, {
      foreignKey: 'mediaTypeId',
      as: 'contents'
    });
  };

  return MediaType;
};
