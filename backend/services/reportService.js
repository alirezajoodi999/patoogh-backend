// services/reportService.js
const { Op } = require('sequelize');
const { 
  User, 
  Competency, 
  Content, 
  ContentEvaluation, 
  UserProgress, 
  ContentSuggestion,
  MediaType 
} = require('../models');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ReportService {
  /**
   * گزارش پیشرفت کاربر
   * @param {number} userId - شناسه کاربر
   * @param {Date} startDate - تاریخ شروع
   * @param {Date} endDate - تاریخ پایان
   */
  async getUserProgressReport(userId, startDate = null, endDate = null) {
    const whereClause = { user_id: userId };
    
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const progress = await UserProgress.findAll({
      where: whereClause,
      include: [
        {
          model: Content,
          as: 'content',
          include: [
            { model: Competency, as: 'competency' },
            { model: MediaType, as: 'mediaType' }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const summary = {
      totalContent: progress.length,
      completedContent: progress.filter(p => p.status === 'completed').length,
      inProgressContent: progress.filter(p => p.status === 'in_progress').length,
      notStartedContent: progress.filter(p => p.status === 'not_started').length,
      averageProgress: progress.reduce((sum, p) => sum + p.progress_percentage, 0) / progress.length || 0,
      totalTimeSpent: progress.reduce((sum, p) => sum + (p.time_spent || 0), 0)
    };

    const byCompetency = {};
    progress.forEach(p => {
      if (p.content && p.content.competency) {
        const compName = p.content.competency.name;
        if (!byCompetency[compName]) {
          byCompetency[compName] = {
            total: 0,
            completed: 0,
            avgProgress: 0,
            progressSum: 0
          };
        }
        byCompetency[compName].total++;
        if (p.status === 'completed') byCompetency[compName].completed++;
        byCompetency[compName].progressSum += p.progress_percentage;
      }
    });

    Object.keys(byCompetency).forEach(key => {
      byCompetency[key].avgProgress = 
        byCompetency[key].progressSum / byCompetency[key].total;
      delete byCompetency[key].progressSum;
    });

    return {
      userId,
      period: { startDate, endDate },
      summary,
      byCompetency,
      details: progress
    };
  }

  /**
   * گزارش ارزیابی محتوا
   * @param {number} contentId - شناسه محتوا
   */
  async getContentEvaluationReport(contentId) {
    const evaluations = await ContentEvaluation.findAll({
      where: { content_id: contentId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const content = await Content.findByPk(contentId, {
      include: [
        { model: Competency, as: 'competency' },
        { model: MediaType, as: 'mediaType' }
      ]
    });

    const summary = {
      totalEvaluations: evaluations.length,
      averageRating: evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length || 0,
      ratingDistribution: {
        1: evaluations.filter(e => e.rating === 1).length,
        2: evaluations.filter(e => e.rating === 2).length,
        3: evaluations.filter(e => e.rating === 3).length,
        4: evaluations.filter(e => e.rating === 4).length,
        5: evaluations.filter(e => e.rating === 5).length
      }
    };

    return {
      content,
      summary,
      evaluations
    };
  }

  /**
   * گزارش کلی سازمان
   * @param {Date} startDate - تاریخ شروع
   * @param {Date} endDate - تاریخ پایان
   */
  async getOrganizationReport(startDate = null, endDate = null) {
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    // آمار کاربران
    const totalUsers = await User.count({ where: { role: 'manager' } });
    const activeUsers = await UserProgress.count({
      where: whereClause,
      distinct: true,
      col: 'user_id'
    });

    // آمار محتوا
    const totalContent = await Content.count({ where: { status: 'active' } });
    const contentByType = await Content.findAll({
      attributes: [
        'media_type_id',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { status: 'active' },
      include: [{ model: MediaType, as: 'mediaType', attributes: ['name'] }],
      group: ['media_type_id', 'mediaType.id', 'mediaType.name']
    });

    // آمار پیشرفت
    const allProgress = await UserProgress.findAll({
      where: whereClause,
      attributes: ['status', 'progress_percentage']
    });

    const progressSummary = {
      total: allProgress.length,
      completed: allProgress.filter(p => p.status === 'completed').length,
      inProgress: allProgress.filter(p => p.status === 'in_progress').length,
      notStarted: allProgress.filter(p => p.status === 'not_started').length,
      averageProgress: allProgress.reduce((sum, p) => sum + p.progress_percentage, 0) / allProgress.length || 0
    };

    // آمار ارزیابی‌ها
    const evaluations = await ContentEvaluation.findAll({
      where: whereClause,
      attributes: ['rating']
    });

    const evaluationSummary = {
      total: evaluations.length,
      averageRating: evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length || 0
    };

    // آمار پیشنهادات
    const suggestions = await ContentSuggestion.count({ where: whereClause });

    return {
      period: { startDate, endDate },
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: (activeUsers / totalUsers * 100) || 0
      },
      content: {
        total: totalContent,
        byType: contentByType
      },
      progress: progressSummary,
      evaluations: evaluationSummary,
      suggestions
    };
  }

  /**
   * گزارش شایستگی‌ها
   */
  async getCompetenciesReport() {
    const competencies = await Competency.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Content,
          as: 'contents',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    const report = await Promise.all(
      competencies.map(async (comp) => {
        const contentIds = comp.contents.map(c => c.id);
        
        const progressCount = await UserProgress.count({
          where: {
            content_id: { [Op.in]: contentIds }
          }
        });

        const completedCount = await UserProgress.count({
          where: {
            content_id: { [Op.in]: contentIds },
            status: 'completed'
          }
        });

        const avgRating = await ContentEvaluation.findOne({
          where: {
            content_id: { [Op.in]: contentIds }
          },
          attributes: [
            [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating']
          ],
          raw: true
        });

        return {
          id: comp.id,
          name: comp.name,
          description: comp.description,
          totalContent: comp.contents.length,
          totalProgress: progressCount,
          completedProgress: completedCount,
          completionRate: progressCount > 0 ? (completedCount / progressCount * 100) : 0,
          averageRating: parseFloat(avgRating?.avgRating) || 0
        };
      })
    );

    return report;
  }

  /**
   * تولید گزارش PDF
   * @param {Object} data - داده‌های گزارش
   * @param {string} title - عنوان گزارش
   */
  async generatePDFReport(data, title) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // هدر
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, { align: 'left' });
        doc.moveDown(2);

        // محتوا
        doc.fontSize(12).text(JSON.stringify(data, null, 2));

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * تولید گزارش Excel
   * @param {Object} data - داده‌های گزارش
   * @param {string} sheetName - نام شیت
   */
  async generateExcelReport(data, sheetName = 'Report') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // تبدیل داده به آرایه برای Excel
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);
        
        data.forEach(row => {
          const values = headers.map(header => row[header]);
          worksheet.addRow(values);
        });
      }
    } else {
      // برای آبجکت‌ها
      worksheet.addRow(['Key', 'Value']);
      Object.entries(data).forEach(([key, value]) => {
        worksheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value]);
      });
    }

    // استایل هدر
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // تنظیم عرض ستون‌ها
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * گزارش کاربران غیرفعال
   * @param {number} days - تعداد روزهای عدم فعالیت
   */
  async getInactiveUsersReport(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allUsers = await User.findAll({
      where: { role: 'manager', is_active: true },
      attributes: ['id', 'first_name', 'last_name', 'email', 'created_at']
    });

    const inactiveUsers = [];

    for (const user of allUsers) {
      const lastActivity = await UserProgress.findOne({
        where: { user_id: user.id },
        order: [['updated_at', 'DESC']],
        attributes: ['updated_at']
      });

      if (!lastActivity || lastActivity.updated_at < cutoffDate) {
        inactiveUsers.push({
          ...user.toJSON(),
          lastActivity: lastActivity?.updated_at || null,
          daysSinceLastActivity: lastActivity 
            ? Math.floor((new Date() - lastActivity.updated_at) / (1000 * 60 * 60 * 24))
            : null
        });
      }
    }

    return {
      cutoffDays: days,
      cutoffDate,
      totalUsers: allUsers.length,
      inactiveCount: inactiveUsers.length,
      inactivePercentage: (inactiveUsers.length / allUsers.length * 100) || 0,
      users: inactiveUsers
    };
  }
}

module.exports = new ReportService();
