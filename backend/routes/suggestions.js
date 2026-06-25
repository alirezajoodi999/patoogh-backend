const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin, isContentManager } = require('../middleware/roleMiddleware');

// @route   GET /api/suggestions/all
// @desc    Get all suggestions (Admin/ContentManager)
// @access  Admin/ContentManager
router.get('/all', authenticateToken, isContentManager, suggestionController.getAllSuggestions);

// @route   GET /api/suggestions
// @desc    Get all suggestions for current user
// @access  Private
router.get('/', authenticateToken, suggestionController.getMySuggestions);

// @route   POST /api/suggestions
// @desc    Create new content suggestion
// @access  Private
router.post('/', authenticateToken, suggestionController.createSuggestion);

// @route   POST /api/suggestions/:id/approve
// @desc    Approve suggestion
// @access  Admin/ContentManager
router.post('/:id/approve', authenticateToken, isContentManager, suggestionController.approveSuggestion);

// @route   POST /api/suggestions/:id/reject
// @desc    Reject suggestion
// @access  Admin/ContentManager
router.post('/:id/reject', authenticateToken, isContentManager, suggestionController.rejectSuggestion);

// @route   PUT /api/suggestions/:id/status
// @desc    Update suggestion status
// @access  Admin/ContentManager
router.put('/:id/status', authenticateToken, isContentManager, suggestionController.updateSuggestionStatus);

// @route   GET /api/suggestions/:id
// @desc    Get suggestion by ID
// @access  Private
router.get('/:id', authenticateToken, suggestionController.getSuggestionById);

// @route   PUT /api/suggestions/:id
// @desc    Update suggestion
// @access  Private
router.put('/:id', authenticateToken, suggestionController.updateSuggestion);

// @route   DELETE /api/suggestions/:id
// @desc    Delete suggestion
// @access  Private
router.delete('/:id', authenticateToken, suggestionController.deleteSuggestion);

module.exports = router;
