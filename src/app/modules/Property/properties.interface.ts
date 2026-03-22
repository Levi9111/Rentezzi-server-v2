import { Document, Model, Types } from 'mongoose';

// ─── Tenant ───────────────────────────────────────────────────────────────────
export type TTenant = {
  name: string;
  phone: string;
  rentStartDate: string;
  rentAmount: number;
  waterBill?: number;
  gasBill?: number;
  otherBills?: number;
};

// ─── Unit ─────────────────────────────────────────────────────────────────────
export type TUnit = {
  _id?: Types.ObjectId;
  name: string;
  tenant: TTenant | null;
};

// ─── Tenant History Entry ─────────────────────────────────────────────────────
export type TTenantHistoryEntry = {
  _id?: Types.ObjectId;
  unitId: Types.ObjectId;
  unitName: string;
  tenant: TTenant;
  rentedFrom: string;
  vacatedAt: Date;
  notes?: string;
};

// ─── Property ─────────────────────────────────────────────────────────────────
export type TProperty = {
  userId: Types.ObjectId;
  name: string;
  address: string;
  units: TUnit[];
  tenantHistory: TTenantHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
};

// ─── Statics ──────────────────────────────────────────────────────────────────
export interface IPropertyModel extends Model<TProperty & Document> {
  isPropertyOwnedByUser(
    propertyId: string,
    userId: string,
  ): Promise<(TProperty & Document) | null>;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────
export type TCreatePropertyBody = {
  name: string;
  address: string;
};

export type TUpdatePropertyBody = {
  name?: string;
  address?: string;
};

export type TAddUnitBody = {
  name: string;
};

export type TUpdateUnitBody = {
  name: string;
};

export type TAssignTenantBody = {
  name: string;
  phone: string;
  rentStartDate: string;
  rentAmount: number;
  waterBill?: number;
  gasBill?: number;
  otherBills?: number;
};

export type TClearTenantBody = {
  notes?: string;
};

// ─── Return Types ─────────────────────────────────────────────────────────────
export type TVacancySummary = {
  totalUnits: number;
  vacantUnits: number;
  occupiedUnits: number;
};
