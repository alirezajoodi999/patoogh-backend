const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getAllContentSources,
  getContentSourceById,
  createContentSource,
  updateContentSource,
  deleteContentSource
} = require('../controllers/contentSourceController');

router.get('/', authenticateToken, getAllContentSources);
router.get('/:id', authenticateToken, getContentSourceById);
router.post('/', authenticateToken, createContentSource);
router.put('/:id', authenticateToken, updateContentSource);
router.delete('/:id', authenticateToken, deleteContentSource);

module.exports = router;
