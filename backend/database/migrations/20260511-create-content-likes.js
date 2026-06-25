'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // حذف جدول قبلی (اگر وجود داشته باشد)
    await queryInterface.dropTable('content_likes');
    
    // ساخت جدول با ستون صحیح
    await queryInterface.createTable('content_likes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'contents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // ایندکس unique برای جلوگیری از لایک تکراری
    await queryInterface.addIndex('content_likes', ['user_id', 'content_id'], {
      unique: true,
      name: 'content_likes_user_content_unique'
    });

    // ایندکس برای بهبود performance
    await queryInterface.addIndex('content_likes', ['content_id'], {
      name: 'content_likes_content_id_idx'
    });

    await queryInterface.addIndex('content_likes', ['user_id'], {
      name: 'content_likes_user_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('content_likes');
  }
};
