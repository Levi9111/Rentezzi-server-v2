import { Schema, model } from 'mongoose';
import { TReceipt } from './receipt.interface';

// ─── Receipt Schema ───────────────────────────────────────────────────────────
const receiptSchema = new Schema<TReceipt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Tenant info ────────────────────────────────────────────────────────
    tenantName: { type: String, required: true, trim: true },
    tenantPhone: { type: String, required: true, trim: true },

    // ── Property info (resolved server-side) ──────────────────────────────
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    propertyAddress: { type: String, required: true },

    // ── Rent details ────────────────────────────────────────────────────
    rentAmount: {
      type: Number,
      required: true,
      min: [0, 'Rent amount cannot be negative'],
    },
    monthYear: { type: String, required: true },
    paymentDate: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_banking'],
      required: true,
    },

    // ── Landlord info (resolved server-side) ──────────────────────────────
    landlordName: { type: String, required: true },
    landlordPhone: { type: String, required: true },

    // ── Optional ──────────────────────────────────────────────────────────
    notes: { type: String, default: '' },
    receiptLang: {
      type: String,
      enum: ['en', 'bn'],
      default: 'en',
    },

    // ── PDF ───────────────────────────────────────────────────────────────
    pdfUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
receiptSchema.index({ userId: 1 });
receiptSchema.index({ userId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
export const Receipt = model<TReceipt>('Receipt', receiptSchema);
