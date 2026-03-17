import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { ReceiptService } from './receipt.service';

// ✅ Create Receipt
const createReceipt = catchAsync(async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  if (!req.file) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'PDF file is required');
  }

  const result = await ReceiptService.createReceiptIntoDB(
    req.body,
    userId,
    req.file, // 👈 pass file only
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Receipt created successfully',
    data: result,
  });
});

// ✅ Get All Receipts
const getAllReceipts = catchAsync(async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const result = await ReceiptService.getAllReceiptsFromDB(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Receipts retrieved successfully',
    data: result,
  });
});

// ✅ Get Single
const getReceiptById = catchAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params as { id: string };

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Receipt ID is required');
  }
  const result = await ReceiptService.getReceiptByIdFromDB(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Receipt retrieved successfully',
    data: result,
  });
});

// ✅ Send PDF (for future use)
const sendReceiptPdf = catchAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params as { id: string };

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Receipt ID is required');
  }

  await ReceiptService.sendReceiptPdf(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'PDF sent successfully',
    data: null,
  });
});

export const ReceiptController = {
  createReceipt,
  getAllReceipts,
  getReceiptById,
  sendReceiptPdf,
};
