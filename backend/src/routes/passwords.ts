import { Router } from 'express';
import { PasswordController, passwordValidation, passwordUpdateValidation } from '../controllers/PasswordController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const passwordController = new PasswordController();

// All password routes require authentication
router.use(authenticateToken);

// Password CRUD operations
router.get('/', passwordController.getAll);
router.get('/stats', passwordController.getStats);
router.get('/:id', passwordController.getById);
router.post('/', passwordValidation, passwordController.create);
router.put('/:id', passwordUpdateValidation, passwordController.update);
router.delete('/:id', passwordController.delete);

// Bulk operations
router.post('/bulk-delete', passwordController.bulkDelete);

export default router;