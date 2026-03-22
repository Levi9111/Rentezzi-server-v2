import { Router } from 'express';
import UserRoutes from '../modules/User/user.route';

import ReceiptRoutes from '../modules/Receipt/receipt.route';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { PropertyRoutes } from '../modules/Property/properties.route';

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
  {
    path: '/receipt',
    route: ReceiptRoutes,
  },
  {
    path: '/property',
    route: PropertyRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
