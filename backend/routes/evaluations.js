// backend/routes/evaluations.js
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { evaluationValidation } = require('../middleware/validationMiddleware');

// مسیرهای خاص باید قبل از مسیرهای عمومی قرار بگیرند

// @route   GET /api/evaluations/criteria
// @desc    Get active evaluation criteria
// @access  Private
router.get('/criteria', authenticateToken, evaluationController.getEvaluationCriteria);

// @route   POST /api/evaluations/criteria
// @desc    Create new evaluation criterion (Admin only)
// @access  Admin
router.post('/criteria', authenticateToken, isAdmin, evaluationController.createCriterion);

// @route   PUT /api/evaluations/criteria/:id
// @desc    Update evaluation criterion (Admin only)
// @access  Admin
router.put('/criteria/:id', authenticateToken, isAdmin, evaluationController.updateCriterion);

// @route   DELETE /api/evaluations/criteria/:id
// @desc    Delete evaluation criterion (Admin only)
// @access  Admin
router.delete('/criteria/:id', authenticateToken, isAdmin, evaluationController.deleteCriterion);

// @route   GET /api/evaluations/content/:contentId/me
// @desc    Get current user's evaluation for specific content
// @access  Private
router.get('/content/:contentId/me', authenticateToken, evaluationController.getUserEvaluation);

// @route   GET /api/evaluations/content/:contentId
// @desc    Get evaluation summary for specific content
// @access  Private
router.get('/content/:contentId', authenticateToken, evaluationController.getContentEvaluations);

// @route   POST /api/evaluations
// @desc    Submit or update evaluation for content
// @access  Private
router.post('/', authenticateToken, evaluationValidation, evaluationController.submitEvaluation);

module.exports = router;
