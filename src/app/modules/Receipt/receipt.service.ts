import { Receipt } from './receipt.model';
import { TReceipt } from './receipt.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import QueryBuilder from '../../builder/Querybuilder';

// later we will integrate PDF + Cloudinary
// import { generatePDF } from './receipt.utils';
// import { uploadToCloudinary } from '../../utils/cloudinary';

const createReceiptIntoDB = async (payload: TReceipt, userId: string) => {
  const receipt = await Receipt.create({
    ...payload,
    ownerId: userId,
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
    isDeleted: { $ne: true },
  });

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(['tenantName', 'tenantPhone', 'apartmentName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  return await queryBuilder.modelQuery;
};

// ✅ Get Single Receipt
const getReceiptByIdFromDB = async (id: string, userId: string) => {
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

export const ReceiptService = {
  createReceiptIntoDB,
  getAllReceiptsFromDB,
  getReceiptByIdFromDB,
};
