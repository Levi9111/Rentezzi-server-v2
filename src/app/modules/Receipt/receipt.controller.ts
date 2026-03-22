import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { ReceiptService } from './receipt.service';

// ─── Create Receipt ───────────────────────────────────────────────────────────
const createReceipt = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  if (!req.file)
    throw new AppError(StatusCodes.BAD_REQUEST, 'PDF file is required');

  const result = await ReceiptService.createReceiptIntoDB(
    req.body,
    req.userId,
    req.file,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Receipt created successfully',
    data: result,
  });
});

// ─── Get All Receipts ─────────────────────────────────────────────────────────
const getAllReceipts = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const result = await ReceiptService.getAllReceiptsFromDB(
    req.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Receipts retrieved successfully',
    data: result,
  });
});

// ─── Get Single Receipt ───────────────────────────────────────────────────────
const getReceiptById = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id } = req.params as { id: string };
  const result = await ReceiptService.getReceiptByIdFromDB(id, req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Receipt retrieved successfully',
    data: result,
  });
});

// ─── Delete Receipt ───────────────────────────────────────────────────────────
const deleteReceipt = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id } = req.params as { id: string };

  await ReceiptService.deleteReceiptFromDB(id, req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Receipt deleted successfully',
  });
});

// ─── Download PDF ─────────────────────────────────────────────────────────────
// NOTE: does NOT use sendResponse — streams the PDF binary directly to the client
const downloadPdf = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');
  const { id } = req.params as { id: string };
  await ReceiptService.downloadReceiptPdf(id, req.userId, res);
});

export const ReceiptControllers = {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  deleteReceipt,
  downloadPdf,
};
