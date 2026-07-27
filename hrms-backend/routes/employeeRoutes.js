const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, employeeController.getAll);
router.get('/:id', verifyToken, employeeController.getById);
router.post('/', verifyToken, requireAdmin, employeeController.create);
router.put('/:id', verifyToken, requireAdmin, employeeController.update);
router.delete('/:id', verifyToken, requireAdmin, employeeController.remove);
router.post('/:id/avatar', verifyToken, requireAdmin, upload.single('avatar'), employeeController.uploadAvatar);
router.get('/:id/history', verifyToken, employeeController.getHistory);

router.post('/:id/avatar', upload.single('avatar'), employeeController.uploadAvatar);

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.remove);

module.exports = router;