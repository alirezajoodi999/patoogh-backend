const recommendationService = require('../services/recommendationService');

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const recommendations = await recommendationService.getPersonalizedRecommendations(
      userId,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLearningPath = async (req, res) => {
  try {
    const userId = req.user.id;

    const learningPath = await recommendationService.generateLearningPath(userId);

    res.status(200).json({
      success: true,
      data: learningPath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};