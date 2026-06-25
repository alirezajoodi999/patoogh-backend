const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  try {
    const { contentId, parentId, text } = req.body;
    const userId = req.user.id;

    const comment = new Comment({
      contentId,
      userId,
      parentId: parentId || null,
      text
    });

    await comment.save();
    await comment.populate('userId', 'fullName profileImage');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCommentsByContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      contentId,
      parentId: null // Only top-level comments
    })
    .populate('userId', 'fullName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get replies for each comment
    const commentIds = comments.map(c => c._id);
    const replies = await Comment.find({
      parentId: { $in: commentIds }
    })
    .populate('userId', 'fullName profileImage')
    .sort({ createdAt: 1 });

    // Group replies by parent
    const repliesMap = {};
    replies.forEach(reply => {
      if (!repliesMap[reply.parentId]) {
        repliesMap[reply.parentId] = [];
      }
      repliesMap[reply.parentId].push(reply);
    });

    const result = comments.map(comment => ({
      ...comment.toObject(),
      replies: repliesMap[comment._id] || []
    }));

    const total = await Comment.countDocuments({ contentId, parentId: null });

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.text = text;
    comment.isEdited = true;
    comment.updatedAt = Date.now();
    await comment.save();

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Allow if user is the author or admin
    if (comment.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentId: id });
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      likes: comment.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};