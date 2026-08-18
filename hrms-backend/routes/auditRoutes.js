const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyAdmin, auditController.getAll);
router.get('/actions', verifyToken, verifyAdmin, auditController.getActions);
router.get('/users', verifyToken, verifyAdmin, auditController.getUsers);

module.exports = router;
