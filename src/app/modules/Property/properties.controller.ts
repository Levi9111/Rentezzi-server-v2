import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { PropertyService } from './properties.service';

// ─── Create Property ──────────────────────────────────────────────────────────
const createProperty = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const result = await PropertyService.createPropertyIntoDB(
    req.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Property created successfully',
    data: result,
  });
});

// ─── Get All Properties ───────────────────────────────────────────────────────
const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const result = await PropertyService.getAllPropertiesFromDB(req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'All properties fetched successfully',
    data: result,
  });
});

// ─── Get Single Property ──────────────────────────────────────────────────────
const getSingleProperty = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id } = req.params as { id: string };
  const result = await PropertyService.getSinglePropertyFromDB(id, req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Property fetched successfully',
    data: result,
  });
});

// ─── Update Property ──────────────────────────────────────────────────────────
const updateProperty = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id } = req.params as { id: string };
  const result = await PropertyService.updatePropertyIntoDB(
    id,
    req.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Property updated successfully',
    data: result,
  });
});

// ─── Delete Property ──────────────────────────────────────────────────────────
const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id } = req.params as { id: string };
  await PropertyService.deletePropertyFromDB(id, req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Property deleted successfully',
  });
});

// ─── Add Unit ─────────────────────────────────────────────────────────────────
const addUnit = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id } = req.params as { id: string };
  const result = await PropertyService.addUnitIntoDB(id, req.userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Unit added successfully',
    data: result,
  });
});

// ─── Update Unit ──────────────────────────────────────────────────────────────
const updateUnit = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id, unitId } = req.params as { id: string; unitId: string };
  const result = await PropertyService.updateUnitIntoDB(
    id,
    unitId,
    req.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unit updated successfully',
    data: result,
  });
});

// ─── Delete Unit ──────────────────────────────────────────────────────────────
const deleteUnit = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id, unitId } = req.params as { id: string; unitId: string };
  await PropertyService.deleteUnitFromDB(id, unitId, req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unit deleted successfully',
  });
});

// ─── Assign Tenant ────────────────────────────────────────────────────────────
const assignTenant = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id, unitId } = req.params as { id: string; unitId: string };
  const result = await PropertyService.assignTenantIntoDB(
    id,
    unitId,
    req.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tenant assigned successfully',
    data: result,
  });
});

// ─── Clear Tenant ─────────────────────────────────────────────────────────────
const clearTenant = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const { id, unitId } = req.params as { id: string; unitId: string };
  await PropertyService.clearTenantFromDB(id, unitId, req.userId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tenant removed and moved to history successfully',
  });
});

// ─── Get All Tenant History (across all properties) ───────────────────────────
const getTenantHistory = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const result = await PropertyService.getTenantHistoryFromDB(req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Tenant history fetched successfully',
    data: result,
  });
});

// ─── Get Tenant History for a Single Property ─────────────────────────────────
const getPropertyTenantHistory = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.userId)
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

    const { id } = req.params as { id: string };
    const result = await PropertyService.getPropertyTenantHistoryFromDB(
      id,
      req.userId,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Property tenant history fetched successfully',
      data: result,
    });
  },
);

// ─── Vacancy Summary ──────────────────────────────────────────────────────────
const getVacancySummary = catchAsync(async (req: Request, res: Response) => {
  if (!req.userId)
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized access!');

  const result = await PropertyService.getVacancySummaryFromDB(req.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Vacancy summary fetched successfully',
    data: result,
  });
});

export const PropertyControllers = {
  createProperty,
  getAllProperties,
  getSingleProperty,
  updateProperty,
  deleteProperty,
  addUnit,
  updateUnit,
  deleteUnit,
  assignTenant,
  clearTenant,
  getTenantHistory,
  getPropertyTenantHistory,
  getVacancySummary,
};
