const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, employeeController.getAll);
router.get('/:id', verifyToken, employeeController.getById);
router.get('/:id/history', verifyToken, employeeController.getHistory);
router.post('/', verifyToken, verifyAdmin, employeeController.create);
router.put('/:id', verifyToken, verifyAdmin, employeeController.update);
router.delete('/:id', verifyToken, verifyAdmin, employeeController.remove);
router.post('/:id/avatar', verifyToken, verifyAdmin, upload.single('avatar'), employeeController.uploadAvatar);

module.exports = router;