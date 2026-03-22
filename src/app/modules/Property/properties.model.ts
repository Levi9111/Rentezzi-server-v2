import { Schema, model } from 'mongoose';
import { TProperty, TUnit, TTenant, TTenantHistoryEntry, IPropertyModel } from './properties.interface';

// ─── Tenant Sub-Schema ────────────────────────────────────────────────────────
const tenantSchema = new Schema<TTenant>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    rentStartDate: { type: String, required: true },
    rentAmount: { type: Number, required: true, min: 0 },
    waterBill: { type: Number, default: null },
    gasBill: { type: Number, default: null },
    otherBills: { type: Number, default: null },
  },
  { _id: false },
);

// ─── Unit Sub-Schema ──────────────────────────────────────────────────────────
const unitSchema = new Schema<TUnit>({
  name: { type: String, required: true, trim: true },
  tenant: { type: tenantSchema, default: null },
});

// ─── Tenant History Entry Sub-Schema ─────────────────────────────────────────
const tenantHistoryEntrySchema = new Schema<TTenantHistoryEntry>(
  {
    unitId: { type: Schema.Types.ObjectId, required: true },
    unitName: { type: String, required: true },
    tenant: { type: tenantSchema, required: true },
    rentedFrom: { type: String, required: true },
    vacatedAt: { type: Date, required: true },
    notes: { type: String, default: '' },
  },
  { _id: true },
);

// ─── Property Schema ──────────────────────────────────────────────────────────
const propertySchema = new Schema<TProperty, IPropertyModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Property name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    units: { type: [unitSchema], default: [] },
    tenantHistory: { type: [tenantHistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
propertySchema.index({ userId: 1 });
propertySchema.index({ 'tenantHistory.tenant.name': 1 });
propertySchema.index({ 'tenantHistory.tenant.phone': 1 });

// ─── Static: Check Ownership ──────────────────────────────────────────────────
propertySchema.statics.isPropertyOwnedByUser = async function (
  propertyId: string,
  userId: string,
) {
  return this.findOne({ _id: propertyId, userId });
};

// ─── Model ────────────────────────────────────────────────────────────────────
export const Property = model<TProperty, IPropertyModel>(
  'Property',
  propertySchema,
);
