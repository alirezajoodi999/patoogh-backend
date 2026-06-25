const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getAllMediaTypes,
  getMediaTypeById,
  createMediaType,
  updateMediaType,
  deleteMediaType
} = require('../controllers/mediaTypeController');

router.get('/', authenticateToken, getAllMediaTypes);
router.get('/:id', authenticateToken, getMediaTypeById);
router.post('/', authenticateToken, createMediaType);
router.put('/:id', authenticateToken, updateMediaType);
router.delete('/:id', authenticateToken, deleteMediaType);

module.exports = router;
