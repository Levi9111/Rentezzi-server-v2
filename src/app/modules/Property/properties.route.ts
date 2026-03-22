import { Router } from 'express';
import { PropertyControllers } from './properties.controller';
import { PropertyValidation } from './properties.validation';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

// ─── All routes require authentication ────────────────────────────────────────
router.use(authenticate);

// ─── Special routes — must come before /:id ───────────────────────────────────
router.get('/vacancy-summary', PropertyControllers.getVacancySummary);
router.get('/tenant-history', PropertyControllers.getTenantHistory);

// ─── Property Routes ──────────────────────────────────────────────────────────
router.get('/', PropertyControllers.getAllProperties);

router.get('/:id', PropertyControllers.getSingleProperty);

router.post(
  '/create-property',
  validateRequest(PropertyValidation.createPropertyValidationSchema),
  PropertyControllers.createProperty,
);

router.patch(
  '/update-property/:id',
  validateRequest(PropertyValidation.updatePropertyValidationSchema),
  PropertyControllers.updateProperty,
);

router.delete('/delete-property/:id', PropertyControllers.deleteProperty);

// ─── Unit Routes ──────────────────────────────────────────────────────────────
router.post(
  '/:id/add-unit',
  validateRequest(PropertyValidation.addUnitValidationSchema),
  PropertyControllers.addUnit,
);

router.patch(
  '/:id/update-unit/:unitId',
  validateRequest(PropertyValidation.updateUnitValidationSchema),
  PropertyControllers.updateUnit,
);

router.delete('/:id/delete-unit/:unitId', PropertyControllers.deleteUnit);

// ─── Tenant Routes ────────────────────────────────────────────────────────────
router.put(
  '/:id/units/:unitId/assign-tenant',
  validateRequest(PropertyValidation.assignTenantValidationSchema),
  PropertyControllers.assignTenant,
);

router.delete(
  '/:id/units/:unitId/clear-tenant',
  validateRequest(PropertyValidation.clearTenantValidationSchema),
  PropertyControllers.clearTenant,
);

// ─── Tenant History Routes ────────────────────────────────────────────────────
router.get('/:id/tenant-history', PropertyControllers.getPropertyTenantHistory);

export const PropertyRoutes = router;
