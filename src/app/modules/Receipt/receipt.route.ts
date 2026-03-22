import express from 'express';
import { ReceiptControllers } from './receipt.controller';
import { authenticate } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReceiptValidation } from './receipt.validation';
import { fileUploader } from '../../utils/fileUploader';

const router = express.Router();

router.post(
  '/',
  authenticate,
  fileUploader.upload.single('pdf'),
  validateRequest(ReceiptValidation.createReceiptValidationSchema),
  ReceiptControllers.createReceipt,
);

router.get('/', authenticate, ReceiptControllers.getAllReceipts);

router.get('/:id', authenticate, ReceiptControllers.getReceiptById);

router.delete('/:id', authenticate, ReceiptControllers.deleteReceipt);

router.get('/:id/download-pdf', authenticate, ReceiptControllers.downloadPdf);

const ReceiptRoutes = router;

export default ReceiptRoutes;
