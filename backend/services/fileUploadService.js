const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../utils/logger');

class FileUploadService {
  constructor() {
    this.uploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      // تصاویر
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // ویدیو
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      // صوت
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      // اسناد
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // فشرده
      'application/zip',
      'application/x-rar-compressed',
    ];

    this.initializeDirectories();
  }

  /**
   * ایجاد دایرکتوری‌های مورد نیاز
   */
  async initializeDirectories() {
    try {
      const dirs = [
        this.uploadsDir,
        path.join(this.uploadsDir, 'images'),
        path.join(this.uploadsDir, 'videos'),
        path.join(this.uploadsDir, 'audio'),
        path.join(this.uploadsDir, 'documents'),
        path.join(this.uploadsDir, 'others'),
      ];

      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }

      logger.info('✅ دایرکتوری‌های آپلود ایجاد شدند');
    } catch (error) {
      logger.error('❌ خطا در ایجاد دایرکتوری‌های آپلود:', error);
    }
  }

  /**
   * تعیین دایرکتوری بر اساس نوع فایل
   */
  getSubDirectory(mimetype) {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('presentation')) {
      return 'documents';
    }
    return 'others';
  }

  /**
   * تولید نام فایل یکتا
   */
  generateUniqueFilename(originalname) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalname);
    const nameWithoutExt = path.basename(originalname, ext);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    return `${safeName}_${timestamp}_${randomString}${ext}`;
  }

  /**
   * پیکربندی multer storage
   */
  getMulterStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const subDir = this.getSubDirectory(file.mimetype);
        const fullPath = path.join(this.uploadsDir, subDir);
        cb(null, fullPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      },
    });
  }

  /**
   * فیلتر فایل‌ها بر اساس نوع
   */
  fileFilter(req, file, cb) {
    if (this.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`نوع فایل ${file.mimetype} مجاز نیست`), false);
    }
  }

  /**
   * ایجاد middleware multer
   */
  createUploadMiddleware(fieldName = 'file', maxCount = 1) {
    return multer({
      storage: this.getMulterStorage(),
      fileFilter: this.fileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: maxCount,
      },
    });
  }

  /**
   * آپلود تک فایل
   */
  uploadSingle(fieldName = 'file') {
    return this.createUploadMiddleware(fieldName, 1).single(fieldName);
  }

  /**
   * آپلود چند فایل
   */
  uploadMultiple(fieldName = 'files', maxCount = 5) {
    return this.createUploadMiddleware(fieldName, maxCount).array(fieldName, maxCount);
  }

  /**
   * ذخیره اطلاعات فایل آپلود شده
   */
  async saveFileInfo(file, userId = null) {
    try {
      const subDir = this.getSubDirectory(file.mimetype);
      const relativePath = path.join(subDir, file.filename);
      
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        path: relativePath,
        fullPath: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: userId,
        uploadedAt: new Date(),
        url: `/uploads/${relativePath}`,
      };

      logger.info(`✅ فایل ${file.originalname} آپلود شد`);
      return fileInfo;
    } catch (error) {
      logger.error('❌ خطا در ذخیره اطلاعات فایل:', error);
      throw error;
    }
  }

  /**
   * حذف فایل
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      await fs.unlink(fullPath);
      logger.info(`✅ فایل ${filePath} حذف شد`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`⚠️ فایل ${filePath} وجود ندارد`);
        return false;
      }
      logger.error('❌ خطا در حذف فایل:', error);
      throw error;
    }
  }

  /**
   * بررسی وجود فایل
   */
  async fileExists(filePath) {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * دریافت اطلاعات فایل
   */
  async getFileInfo(filePath) {
    try {
      const fullPath = path.join(this.uploadsDir, filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile(),
      };
    } catch (error) {
      logger.error('❌ خطا در دریافت اطلاعات فایل:', error);
      throw error;
    }
  }

  /**
   * پاک‌سازی فایل‌های موقت قدیمی
   */
  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      const tempDir = path.join(this.uploadsDir, 'temp');

      try {
        const files = await fs.readdir(tempDir);
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      } catch (error) {
        // دایرکتوری temp وجود ندارد
      }

      logger.info(`✅ ${deletedCount} فایل موقت قدیمی پاک‌سازی شد`);
      return deletedCount;
    } catch (error) {
      logger.error('❌ خطا در پاک‌سازی فایل‌های قدیمی:', error);
      throw error;
    }
  }

  /**
   * محاسبه حجم کل فایل‌های آپلود شده
   */
  async getTotalStorageUsed() {
    try {
      let totalSize = 0;

      const calculateDirSize = async (dirPath) => {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dirPath, file.name);
          
          if (file.isDirectory()) {
            totalSize += await calculateDirSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        }
        
        return totalSize;
      };

      await calculateDirSize(this.uploadsDir);
      
      return {
        bytes: totalSize,
        kilobytes: (totalSize / 1024).toFixed(2),
        megabytes: (totalSize / (1024 * 1024)).toFixed(2),
        gigabytes: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      };
    } catch (error) {
      logger.error('❌ خطا در محاسبه حجم فضای استفاده شده:', error);
      throw error;
    }
  }
}

module.exports = new FileUploadService();
