const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// User Management
// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', adminController.getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Admin
router.get('/users/:id', adminController.getUserById);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put('/users/:id', adminController.updateUser);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', adminController.deleteUser);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role', adminController.updateUserRole);

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Admin
router.put('/users/:id/status', adminController.updateUserStatus);

// Content Management
// @route   GET /api/admin/content/pending
// @desc    Get pending content
// @access  Admin
router.get('/content/pending', adminController.getPendingContent);

// @route   PUT /api/admin/content/:id/approve
// @desc    Approve content
// @access  Admin
router.put('/content/:id/approve', adminController.approveContent);

// @route   PUT /api/admin/content/:id/reject
// @desc    Reject content
// @access  Admin
router.put('/content/:id/reject', adminController.rejectContent);

// Reports
// @route   GET /api/admin/reports/users
// @desc    Get user statistics report
// @access  Admin
router.get('/reports/users', adminController.getUsersReport);

// @route   GET /api/admin/reports/content
// @desc    Get content statistics report
// @access  Admin
router.get('/reports/content', adminController.getContentReport);

// @route   GET /api/admin/reports/progress
// @desc    Get overall progress report
// @access  Admin
router.get('/reports/progress', adminController.getProgressReport);

// @route   GET /api/admin/reports/evaluations
// @desc    Get evaluations report
// @access  Admin
router.get('/reports/evaluations', adminController.getEvaluationsReport);

// @route   GET /api/admin/reports/export
// @desc    Export reports to Excel/PDF
// @access  Admin
router.get('/reports/export', adminController.exportReport);

// System Statistics
// @route   GET /api/admin/statistics/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/statistics/dashboard', adminController.getDashboardStatistics);

// @route   GET /api/admin/statistics/activity
// @desc    Get system activity logs
// @access  Admin
router.get('/statistics/activity', adminController.getActivityLogs);

// Notifications
// @route   POST /api/admin/notifications/broadcast
// @desc    Send broadcast notification
// @access  Admin
router.post('/notifications/broadcast', adminController.sendBroadcastNotification);

module.exports = router;
