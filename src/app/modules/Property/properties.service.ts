import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Property } from './properties.model';
import {
  TCreatePropertyBody,
  TUpdatePropertyBody,
  TAddUnitBody,
  TUpdateUnitBody,
  TAssignTenantBody,
  TClearTenantBody,
  TVacancySummary,
  IPropertyModel,
} from './properties.interface';

// ─── Create Property ──────────────────────────────────────────────────────────
const createPropertyIntoDB = async (
  userId: string,
  payload: TCreatePropertyBody,
) => {
  const result = await Property.create({ userId, ...payload });
  return result;
};

// ─── Get All Properties ───────────────────────────────────────────────────────
const getAllPropertiesFromDB = async (userId: string) => {
  const result = await Property.find({ userId });
  return result;
};

// ─── Get Single Property ──────────────────────────────────────────────────────
const getSinglePropertyFromDB = async (propertyId: string, userId: string) => {
  const result = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!result) throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  return result;
};

// ─── Update Property ──────────────────────────────────────────────────────────
const updatePropertyIntoDB = async (
  propertyId: string,
  userId: string,
  payload: TUpdatePropertyBody,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  for (const [key, value] of Object.entries(payload)) {
    (property as any)[key] = value;
  }

  const result = await property.save();
  return result;
};

// ─── Delete Property ──────────────────────────────────────────────────────────
const deletePropertyFromDB = async (propertyId: string, userId: string) => {
  const deleted = await Property.findOneAndDelete({ _id: propertyId, userId });

  if (!deleted) throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  return deleted;
};

// ─── Add Unit ─────────────────────────────────────────────────────────────────
const addUnitIntoDB = async (
  propertyId: string,
  userId: string,
  payload: TAddUnitBody,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  property.units.push({ name: payload.name, tenant: null });

  const result = await property.save();
  return result;
};

// ─── Update Unit ──────────────────────────────────────────────────────────────
const updateUnitIntoDB = async (
  propertyId: string,
  unitId: string,
  userId: string,
  payload: TUpdateUnitBody,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  const unit = property.units.find((u) => String(u._id) === unitId);

  if (!unit) throw new AppError(StatusCodes.NOT_FOUND, 'Unit not found');

  unit.name = payload.name;

  const result = await property.save();
  return result;
};

// ─── Delete Unit ──────────────────────────────────────────────────────────────
const deleteUnitFromDB = async (
  propertyId: string,
  unitId: string,
  userId: string,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  const unitIndex = property.units.findIndex(
    (u: any) => String(u._id) === unitId,
  );

  if (unitIndex === -1)
    throw new AppError(StatusCodes.NOT_FOUND, 'Unit not found');

  property.units.splice(unitIndex, 1);

  const result = await property.save();
  return result;
};

// ─── Assign Tenant ────────────────────────────────────────────────────────────
const assignTenantIntoDB = async (
  propertyId: string,
  unitId: string,
  userId: string,
  payload: TAssignTenantBody,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  const unit = property.units.find((u) => String(u._id) === unitId);

  if (!unit) throw new AppError(StatusCodes.NOT_FOUND, 'Unit not found');

  if (unit.tenant)
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Unit already has a tenant. Clear the current tenant first.',
    );

  unit.tenant = payload;

  const result = await property.save();
  return result;
};

// ─── Clear Tenant → snapshot into tenantHistory ───────────────────────────────
const clearTenantFromDB = async (
  propertyId: string,
  unitId: string,
  userId: string,
  payload: TClearTenantBody,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  const unit = property.units.find((u) => String(u._id) === unitId);

  if (!unit) throw new AppError(StatusCodes.NOT_FOUND, 'Unit not found');

  if (!unit.tenant)
    throw new AppError(StatusCodes.BAD_REQUEST, 'Unit is already vacant');

  // ── Snapshot tenant into history before clearing ──────────────────────────
  property.tenantHistory.push({
    unitId: unit._id!,
    unitName: unit.name,
    tenant: { ...unit.tenant },
    rentedFrom: unit.tenant.rentStartDate,
    vacatedAt: new Date(),
    notes: payload.notes ?? '',
  });

  unit.tenant = null;

  const result = await property.save();
  return result;
};

// ─── Get Tenant History (all properties of a landlord) ────────────────────────
const getTenantHistoryFromDB = async (userId: string) => {
  const properties = await Property.find(
    { userId, 'tenantHistory.0': { $exists: true } },
    { name: 1, address: 1, tenantHistory: 1 },
  ).lean();

  // Flatten all history entries across properties with property context
  const history = properties.flatMap((property: any) =>
    property.tenantHistory.map((entry: any) => ({
      ...entry,
      propertyId: property._id,
      propertyName: property.name,
      propertyAddress: property.address,
    })),
  );

  // Sort by most recently vacated first
  history.sort(
    (a, b) => new Date(b.vacatedAt).getTime() - new Date(a.vacatedAt).getTime(),
  );

  return history;
};

// ─── Get Tenant History for a Single Property ─────────────────────────────────
const getPropertyTenantHistoryFromDB = async (
  propertyId: string,
  userId: string,
) => {
  const property = await (Property as IPropertyModel).isPropertyOwnedByUser(
    propertyId,
    userId,
  );

  if (!property)
    throw new AppError(StatusCodes.NOT_FOUND, 'Property not found');

  const history = [...property.tenantHistory].sort(
    (a, b) => new Date(b.vacatedAt).getTime() - new Date(a.vacatedAt).getTime(),
  );

  return history;
};

// ─── Vacancy Summary ──────────────────────────────────────────────────────────
const getVacancySummaryFromDB = async (
  userId: string,
): Promise<TVacancySummary> => {
  const result = await Property.aggregate([
    { $match: { userId: userId } },
    { $unwind: { path: '$units', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalUnits: {
          $sum: { $cond: [{ $ifNull: ['$units', false] }, 1, 0] },
        },
        occupiedUnits: {
          $sum: {
            $cond: [{ $ifNull: ['$units.tenant', false] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalUnits: 1,
        occupiedUnits: 1,
        vacantUnits: { $subtract: ['$totalUnits', '$occupiedUnits'] },
      },
    },
  ]);

  if (!result.length) {
    return { totalUnits: 0, vacantUnits: 0, occupiedUnits: 0 };
  }

  return result[0];
};

export const PropertyService = {
  createPropertyIntoDB,
  getAllPropertiesFromDB,
  getSinglePropertyFromDB,
  updatePropertyIntoDB,
  deletePropertyFromDB,
  addUnitIntoDB,
  updateUnitIntoDB,
  deleteUnitFromDB,
  assignTenantIntoDB,
  clearTenantFromDB,
  getTenantHistoryFromDB,
  getPropertyTenantHistoryFromDB,
  getVacancySummaryFromDB,
};
