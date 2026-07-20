const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, requireAdmin, userController.getAll);
router.post('/', verifyToken, requireAdmin, userController.create);
router.get('/by-employee/:employeeId', verifyToken, requireAdmin, userController.getByEmployeeId);
router.put('/:id', verifyToken, requireAdmin, userController.update);

module.exports = router;