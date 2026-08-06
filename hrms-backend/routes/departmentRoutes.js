const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, departmentController.getAll);
router.get('/:id', verifyToken, departmentController.getById);
router.post('/', verifyToken, verifyAdmin, departmentController.create);
router.put('/:id', verifyToken, verifyAdmin, departmentController.update);
router.delete('/:id', verifyToken, verifyAdmin, departmentController.remove);

module.exports = router;