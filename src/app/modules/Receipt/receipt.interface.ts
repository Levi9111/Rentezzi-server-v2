import { Types } from 'mongoose';

// ─── Payment Method ───────────────────────────────────────────────────────────
export type TPaymentMethod = 'cash' | 'bank_transfer' | 'mobile_banking';

// ─── Receipt Language ─────────────────────────────────────────────────────────
export type TReceiptLang = 'en' | 'bn';

// ─── Receipt ──────────────────────────────────────────────────────────────────
export type TReceipt = {
  userId: Types.ObjectId;

  // ── Tenant info ──────────────────────────────────────────────────────────
  tenantName: string;
  tenantPhone: string;

  // ── Property info (resolved server-side) ─────────────────────────────────
  propertyId: Types.ObjectId;
  unitId?: Types.ObjectId;
  propertyAddress: string;

  // ── Rent details ──────────────────────────────────────────────────────────
  rentAmount: number;
  monthYear: string;
  paymentDate: string;
  paymentMethod: TPaymentMethod;

  // ── Landlord info (resolved server-side from JWT user) ────────────────────
  landlordName: string;
  landlordPhone: string;

  // ── Optional ──────────────────────────────────────────────────────────────
  notes?: string;
  receiptLang: TReceiptLang;

  // ── PDF ───────────────────────────────────────────────────────────────────
  pdfUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
};

// ─── Request Body ─────────────────────────────────────────────────────────────
// landlordName, landlordPhone, propertyAddress resolved server-side — not in body
export type TCreateReceiptBody = {
  tenantName: string;
  tenantPhone: string;
  propertyId: string;
  unitId?: string;
  rentAmount: number;
  monthYear: string;
  paymentDate: string;
  paymentMethod: TPaymentMethod;
  notes?: string;
  receiptLang?: TReceiptLang;
};
