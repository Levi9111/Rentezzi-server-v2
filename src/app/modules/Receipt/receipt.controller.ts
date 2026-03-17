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

  const result = await ReceiptService.createReceiptIntoDB(req.body, userId);

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

  if (!userId || !id) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }
  const result = await ReceiptService.getReceiptByIdFromDB(id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Receipt retrieved successfully',
    data: result,
  });
});

export const ReceiptController = {
  createReceipt,
  getAllReceipts,
  getReceiptById,
};
