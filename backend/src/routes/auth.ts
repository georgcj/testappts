import { Router } from 'express';
import { AuthController, registerValidation, loginValidation, updateProfileValidation } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.profile);
router.put('/profile', authenticateToken, updateProfileValidation, authController.updateProfile);

export default router;