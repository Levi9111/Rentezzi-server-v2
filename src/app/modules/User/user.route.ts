import express from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidation } from './user.validation';

const router = express.Router();

router.post(
  '/register',
  validateRequest(UserValidation.registerValidationSchema),
  UserController.register,
);

// User management routes
router.put(
  '/update',
  authenticate,
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser,
);
router.delete('/delete', authenticate, UserController.deleteUser);
router.get('/', authenticate, UserController.getAllUsers);
router.get('/:id', authenticate, UserController.getUserById);

const UserRoutes = router;

export default UserRoutes;
