import { Schema, model } from 'mongoose';
import { TReceipt } from './receipt.interface';

const receiptSchema = new Schema<TReceipt>(
  {
    tenantName: { type: String, required: true },
    tenantPhone: { type: String, required: true },
    apartmentName: { type: String, required: true },
    unit: { type: String, required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    pdfUrl: { type: String },
  },
  { timestamps: true },
);

export const Receipt = model<TReceipt>('Receipt', receiptSchema);
