import express from 'express';
import { ReceiptController } from './receipt.controller';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReceiptValidation } from './receipt.validation';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validateRequest(ReceiptValidation.createReceiptValidationSchema),
  ReceiptController.createReceipt,
);

router.get('/', authenticate, ReceiptController.getAllReceipts);

router.get('/:id', authenticate, ReceiptController.getReceiptById);

const ReceiptRoutes = router;

export default ReceiptRoutes;
