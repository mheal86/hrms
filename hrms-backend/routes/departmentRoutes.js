const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, departmentController.getAll);
router.get('/:id', verifyToken, departmentController.getById);
router.post('/', verifyToken, requireAdmin, departmentController.create);
router.put('/:id', verifyToken, requireAdmin, departmentController.update);
router.delete('/:id', verifyToken, requireAdmin, departmentController.remove);

module.exports = router;