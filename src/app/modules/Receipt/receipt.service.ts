import { Receipt } from './receipt.model';
import { TReceipt } from './receipt.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/Querybuilder';
import mongoose from 'mongoose';
import { fileUploader } from '../../utils/fileUploader';

const createReceiptIntoDB = async (
  payload: TReceipt,
  userId: string,
  file: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'PDF file is required');
  }

  if (file.mimetype !== 'application/pdf') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Only PDF files are allowed');
  }

  // 1️⃣ Upload to Cloudinary
  const uploadResult = await fileUploader.uploadToCloudinary(file);

  if (!uploadResult?.secure_url) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to upload PDF file',
    );
  }

  // 2️⃣ Save to DB
  const receipt = await Receipt.create({
    ...payload,
    ownerId: userId,
    pdfUrl: uploadResult.secure_url,
  });

  return receipt;
};

// ✅ Get All Receipts (only for logged-in user)
const getAllReceiptsFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const baseQuery = Receipt.find({
    ownerId: userId,
  });

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(['tenantName', 'tenantPhone', 'apartmentName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  return await queryBuilder.modelQuery;
};

const getReceiptByIdFromDB = async (id: string, userId: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');
  }

  const receipt = await Receipt.findOne({
    _id: id,
    ownerId: userId,
    isDeleted: { $ne: true },
  });

  if (!receipt) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');
  }

  return receipt;
};

const sendReceiptPdf = async (id: string, userId: string) => {
  console.log('Sending PDF for receipt ID:', id, 'and user ID:', userId);
};

export const ReceiptService = {
  createReceiptIntoDB,
  getAllReceiptsFromDB,
  getReceiptByIdFromDB,
  sendReceiptPdf,
};
