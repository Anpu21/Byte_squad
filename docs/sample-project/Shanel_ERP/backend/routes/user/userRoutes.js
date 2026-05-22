const express = require('express');
const { 
    loginUser, registerUser, refreshToken, logoutUser, 
    getAllUsers, searchUser, getAllModels, updateUser, deleteUser 
} = require('../../controllers/user/userController');
const { requireModule, verifyAccessToken } = require('../../middleware/authMiddleware');

const router = express.Router();

// Authentication
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', verifyAccessToken, logoutUser);

// User Management
router.post('/register', requireModule('user_management'), registerUser);
router.put('/update', requireModule('user_management'), updateUser);
router.delete('/delete', requireModule('user_management'), deleteUser);
router.get('/all', requireModule('user_management'), getAllUsers);
router.get('/search', requireModule('user_management'), searchUser);
router.get('/models', requireModule('user_management'), getAllModels);

module.exports = router;
