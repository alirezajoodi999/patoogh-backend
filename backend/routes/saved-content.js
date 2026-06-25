const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { SavedContent } = require('../models');

router.use(protect);

// ذخیره محتوا برای بعد
router.post('/', async (req, res) => {
  try {
    const { contentId, note } = req.body;
    const [saved, created] = await SavedContent.findOrCreate({
      where: { userId: req.user.id, contentId },
      defaults: { userId: req.user.id, contentId, note }
    });
    res.status(created ? 201 : 200).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// دریافت لیست محتوای ذخیره‌شده
router.get('/', async (req, res) => {
  try {
    const saved = await SavedContent.findAll({
      where: { userId: req.user.id },
      include: [{ association: 'content' }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف از لیست ذخیره‌شده
router.delete('/:contentId', async (req, res) => {
  try {
    const result = await SavedContent.destroy({
      where: { userId: req.user.id, contentId: req.params.contentId }
    });
    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, message: 'Removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; // ✅ مهم