import express from 'express';
import { AuthController } from './user.controller';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './user.validation';

const router = express.Router();

router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register,
);

// User management routes
router.put(
  '/update',
  authenticate,
  validateRequest(AuthValidation.updateUserValidationSchema),
  AuthController.updateUser,
);
router.delete('/delete', authenticate, AuthController.deleteUser);
router.get('/get-all-users', authenticate, AuthController.getAllUsers);
router.get('/:id', authenticate, AuthController.getUserById);

const UserRoutes = router;

export default UserRoutes;
