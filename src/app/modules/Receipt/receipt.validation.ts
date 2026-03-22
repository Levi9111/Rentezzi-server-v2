import { z } from 'zod';

// ─── Create Receipt ───────────────────────────────────────────────────────────
const createReceiptValidationSchema = z.object({
  body: z.object({
    tenantName: z
      .string({ message: 'Tenant name is required' })
      .min(1, 'Tenant name is required')
      .max(100, 'Tenant name cannot exceed 100 characters')
      .trim(),
    tenantPhone: z
      .string({ message: 'Tenant phone is required' })
      .min(1, 'Tenant phone is required')
      .trim(),
    propertyId: z
      .string({ message: 'Property ID is required' })
      .min(1, 'Property ID is required'),
    unitId: z.string().optional(),
    rentAmount: z.coerce
      .number({ message: 'Rent amount is required' })
      .min(0, 'Rent amount cannot be negative'),
    monthYear: z
      .string({ message: 'Month and year is required' })
      .min(1, 'Month and year is required'),
    paymentDate: z
      .string({ message: 'Payment date is required' })
      .min(1, 'Payment date is required'),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'mobile_banking'], {
      message: 'Payment method must be cash, bank_transfer, or mobile_banking',
    }),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    receiptLang: z.enum(['en', 'bn']).optional().default('en'),
  }),
});

export const ReceiptValidation = {
  createReceiptValidationSchema,
};
