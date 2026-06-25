const reportService = require('../services/reportService');

exports.getUserProgressReport = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Only admin can view other users' reports
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const report = await reportService.getUserProgressReport(userId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No progress data found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getOrganizationalInsights = async (req, res) => {
  try {
    // Only admin can view organizational insights
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const insights = await reportService.getOrganizationalInsights();

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getContentEffectiveness = async (req, res) => {
  try {
    const { contentId } = req.params;

    const report = await reportService.getContentEffectivenessReport(contentId);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};