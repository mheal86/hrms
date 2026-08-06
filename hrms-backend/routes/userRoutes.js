const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyAdmin, userController.getAll);
router.get('/check-username', verifyToken, verifyAdmin, userController.checkUsername);
router.post('/', verifyToken, verifyAdmin, userController.create);
router.get('/by-employee/:employeeId', verifyToken, verifyAdmin, userController.getByEmployeeId);
router.put('/:id', verifyToken, verifyAdmin, userController.update);

module.exports = router;