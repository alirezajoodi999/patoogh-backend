const Competency = require('../models/Competency');
const Content = require('../models/Content');
const UserProgress = require('../models/UserProgress');
const ContentEvaluation = require('../models/ContentEvaluation');

class RecommendationService {
  /**
   * Get personalized content recommendations for a user
   */
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // 1. Get user's competency gaps
      const userProgress = await UserProgress.findOne({ userId })
        .populate('competencyProgress.competencyId');
      
      if (!userProgress) {
        return this.getFallbackRecommendations(limit);
      }

      // 2. Find competency gaps (currentLevel < targetLevel)
      const gaps = userProgress.competencyProgress
        .filter(p => p.currentLevel < p.targetLevel)
        .map(p => p.competencyId._id);

      // 3. Get user's viewing history
      const viewedContentIds = userProgress.completedContents
        .map(c => c.contentId.toString());

      // 4. Find content that fills the gaps
      let recommendedContent = [];
      
      if (gaps.length > 0) {
        recommendedContent = await Content.find({
          competencyIds: { $in: gaps },
          _id: { $nin: viewedContentIds },
          status: 'published'
        })
        .sort({ weight: -1, createdAt: -1 })
        .limit(limit)
        .populate('competencyIds');
      }

      // 5. If not enough, add popular content from same role
      if (recommendedContent.length < limit) {
        const remaining = limit - recommendedContent.length;
        const popularContent = await this.getPopularContent(userId, remaining);
        recommendedContent = [...recommendedContent, ...popularContent];
      }

      // 6. If still not enough, add latest content
      if (recommendedContent.length < limit) {
        const remaining = limit - recommendedContent.length;
        const latestContent = await Content.find({
          status: 'published',
          _id: { $nin: [...viewedContentIds, ...recommendedContent.map(c => c._id)] }
        })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .populate('competencyIds');
        recommendedContent = [...recommendedContent, ...latestContent];
      }

      return recommendedContent;
    } catch (error) {
      console.error('Recommendation error:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Get popular content among users with similar role
   */
  async getPopularContent(userId, limit = 5) {
    // Aggregate content with highest average ratings
    const popular = await ContentEvaluation.aggregate([
      {
        $group: {
          _id: '$contentId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1, count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'contents',
          localField: '_id',
          foreignField: '_id',
          as: 'content'
        }
      },
      { $unwind: '$content' }
    ]);

    return popular.map(p => p.content);
  }

  /**
   * Fallback recommendations (latest published content)
   */
  async getFallbackRecommendations(limit = 10) {
    return await Content.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('competencyIds');
  }

  /**
   * Generate a learning path for a user based on competency gaps
   */
  async generateLearningPath(userId) {
    const userProgress = await UserProgress.findOne({ userId })
      .populate('competencyProgress.competencyId');

    if (!userProgress) return null;

    const gaps = userProgress.competencyProgress
      .filter(p => p.currentLevel < p.targetLevel);

    if (gaps.length === 0) return null;

    // For each gap, find relevant content
    const path = [];
    for (const gap of gaps) {
      const contents = await Content.find({
        competencyIds: gap.competencyId._id,
        status: 'published'
      })
      .sort({ difficultyLevel: 1, weight: -1 })
      .limit(3);

      path.push({
        competency: gap.competencyId,
        currentLevel: gap.currentLevel,
        targetLevel: gap.targetLevel,
        contents: contents
      });
    }

    return path;
  }
}

module.exports = new RecommendationService();