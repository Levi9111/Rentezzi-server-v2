import { Router } from 'express';
import UserRoutes from '../modules/User/user.route';
import AuthRoutes from '../modules/Auth/auth.route';

const router = Router();

// TODO: Replace the register APi from auth to the user API.

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
