import { z } from 'zod';

const createReceiptValidationSchema = z.object({
  body: z.object({
    tenantName: z.string(),
    tenantPhone: z.string(),
    apartmentName: z.string(),
    unit: z.string(),
    month: z.string(),
    amount: z.number(),
  }),
});

export const ReceiptValidation = {
  createReceiptValidationSchema,
};
