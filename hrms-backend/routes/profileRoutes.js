const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, profileController.getProfile);
router.put('/', verifyToken, profileController.updateProfile);
router.put('/change-password', verifyToken, profileController.changePassword);

module.exports = router;