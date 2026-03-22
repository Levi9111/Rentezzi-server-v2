import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Receipt } from './receipt.model';
import { TCreateReceiptBody } from './receipt.interface';
import { User } from '../Auth/auth.model';
import { Property } from '../Property/properties.model';
import { fileUploader } from '../../utils/fileUploader';
import { streamPdfToResponse } from './receipt.utils';
import QueryBuilder from '../../builder/Querybuilder';
import { Response } from 'express';

// ─── Create Receipt ───────────────────────────────────────────────────────────
const createReceiptIntoDB = async (
  payload: TCreateReceiptBody,
  userId: string,
  file: Express.Multer.File,
) => {
  if (file.mimetype !== 'application/pdf') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Only PDF files are allowed');
  }

  // ── Resolve landlord info from JWT user ───────────────────────────────────
  const landlord = await User.findById(userId).select('name phone');

  if (!landlord)
    throw new AppError(StatusCodes.NOT_FOUND, 'Landlord not found');

  // ── Resolve property address from propertyId ──────────────────────────────
  const property = await Property.findOne({
    _id: payload.propertyId,
    userId,
  });

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  // ── Resolve unit address if unitId provided ───────────────────────────────
  let propertyAddress = property.address;

  if (payload.unitId) {
    const unit = property.units.find(
      (u: any) => String(u._id) === payload.unitId,
    );

    if (!unit) throw new AppError(StatusCodes.NOT_FOUND, 'Unit not found');

    propertyAddress = `${property.address}, ${unit.name}`;
  }

  // ── Upload PDF to Cloudinary ───────────────────────────────────────────────
  const uploadResult = await fileUploader.uploadToCloudinary(file);

  if (!uploadResult?.secure_url)
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to upload PDF file',
    );

  // ── Save receipt ──────────────────────────────────────────────────────────
  const result = await Receipt.create({
    ...payload,
    userId,
    propertyAddress,
    landlordName: landlord.name,
    landlordPhone: landlord.phone,
    pdfUrl: uploadResult.secure_url,
  });

  return result;
};

// ─── Get All Receipts ─────────────────────────────────────────────────────────
const getAllReceiptsFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const baseQuery = Receipt.find({ userId });

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(['tenantName', 'tenantPhone', 'propertyAddress'])
    .filter()
    .sort()
    .paginate()
    .fields();

  return await queryBuilder.modelQuery;
};

// ─── Get Single Receipt ───────────────────────────────────────────────────────
const getReceiptByIdFromDB = async (id: string, userId: string) => {
  if (!mongoose.isValidObjectId(id))
    throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');

  const result = await Receipt.findOne({ _id: id, userId });

  if (!result) throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');

  return result;
};

// ─── Delete Receipt ───────────────────────────────────────────────────────────
const deleteReceiptFromDB = async (id: string, userId: string) => {
  if (!mongoose.isValidObjectId(id))
    throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');

  const deleted = await Receipt.findOneAndDelete({ _id: id, userId });

  if (!deleted) throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');

  return deleted;
};

// ─── Download PDF ─────────────────────────────────────────────────────────────
const downloadReceiptPdf = async (
  id: string,
  userId: string,
  res: Response,
) => {
  if (!mongoose.isValidObjectId(id))
    throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');

  const receipt = await Receipt.findOne({ _id: id, userId });

  if (!receipt) throw new AppError(StatusCodes.NOT_FOUND, 'Receipt not found');

  if (!receipt.pdfUrl)
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'PDF not available for this receipt',
    );

  const filename = `receipt-${receipt.tenantName}-${receipt.monthYear}`.replace(
    /\s+/g,
    '-',
  );

  await streamPdfToResponse(receipt.pdfUrl, res, filename);
};

export const ReceiptService = {
  createReceiptIntoDB,
  getAllReceiptsFromDB,
  getReceiptByIdFromDB,
  deleteReceiptFromDB,
  downloadReceiptPdf,
};
