const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// @route   GET /api/progress
// @desc    Get current user's progress
// @access  Private
router.get('/', authenticateToken, progressController.getUserProgress);

// @route   GET /api/progress/competency/:competencyId
// @desc    Get progress for specific competency
// @access  Private
router.get('/competency/:competencyId', authenticateToken, progressController.getCompetencyProgress);

// @route   POST /api/progress
// @desc    Update user progress
// @access  Private
router.post('/', authenticateToken, progressController.updateProgress);

// @route   GET /api/progress/dashboard
// @desc    Get progress dashboard data
// @access  Private
router.get('/dashboard', authenticateToken, progressController.getProgressDashboard);

// @route   GET /api/progress/statistics
// @desc    Get user progress statistics
// @access  Private
router.get('/statistics', authenticateToken, progressController.getProgressStatistics);

// @route   GET /api/progress/user/:userId
// @desc    Get progress for specific user (Admin)
// @access  Admin
router.get('/user/:userId', authenticateToken, isAdmin, progressController.getUserProgressById);

// @route   GET /api/progress/report
// @desc    Generate progress report
// @access  Private
router.get('/report', authenticateToken, progressController.generateProgressReport);

// @route   POST /api/progress/complete/:contentId
// @desc    Mark content as completed
// @access  Private
router.post('/complete/:contentId', authenticateToken, progressController.markContentComplete);

module.exports = router;
