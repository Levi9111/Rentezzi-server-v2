import { Types } from 'mongoose';

export type TReceipt = {
  tenantName: string;
  tenantPhone: string;
  apartmentName: string;
  unit: string;
  month: string;
  amount: number;

  ownerId: Types.ObjectId;

  pdfUrl?: string;
};
