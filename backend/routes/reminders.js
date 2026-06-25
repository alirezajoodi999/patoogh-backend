const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/reminders
// @desc    Get all reminders for current user
// @access  Private
router.get('/', authenticateToken, reminderController.getMyReminders);

// @route   POST /api/reminders
// @desc    Create new reminder
// @access  Private
router.post('/', authenticateToken, reminderController.createReminder);

// @route   PUT /api/reminders/:id
// @desc    Update reminder
// @access  Private
router.put('/:id', authenticateToken, reminderController.updateReminder);

// @route   DELETE /api/reminders/:id
// @desc    Delete reminder
// @access  Private
router.delete('/:id', authenticateToken, reminderController.deleteReminder);

module.exports = router;
