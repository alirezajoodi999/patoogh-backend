const express = require('express');
const router = express.Router();
const competencyController = require('../controllers/competencyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin, isHRAdmin } = require('../middleware/roleMiddleware');

// مسیرهای عمومی (نیاز به احراز هویت ندارند)
router.get('/', competencyController.getAllCompetencies);
router.get('/:id', competencyController.getCompetencyById);

// مسیرهای مدیریتی (نیاز به احراز هویت و نقش ادمین دارند)
// ادمین فنی و ادمین آموزش - صفحه ۱۶ مستندات
router.post('/', authenticateToken, isHRAdmin, competencyController.createCompetency);
router.put('/:id', authenticateToken, isHRAdmin, competencyController.updateCompetency);
router.delete('/:id', authenticateToken, isAdmin, competencyController.deleteCompetency);

module.exports = router;
