import { z } from 'zod';

// ─── Create Property ──────────────────────────────────────────────────────────
const createPropertyValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Property name is required' })
      .min(1, 'Property name is required')
      .max(100, 'Property name cannot exceed 100 characters')
      .trim(),
    address: z
      .string({ required_error: 'Address is required' })
      .min(1, 'Address is required')
      .max(200, 'Address cannot exceed 200 characters')
      .trim(),
  }),
});

// ─── Update Property ──────────────────────────────────────────────────────────
const updatePropertyValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Property name is required')
      .max(100, 'Property name cannot exceed 100 characters')
      .trim()
      .optional(),
    address: z
      .string()
      .min(1, 'Address is required')
      .max(200, 'Address cannot exceed 200 characters')
      .trim()
      .optional(),
  }),
});

// ─── Add Unit ─────────────────────────────────────────────────────────────────
const addUnitValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Unit name is required' })
      .min(1, 'Unit name is required')
      .max(50, 'Unit name cannot exceed 50 characters')
      .trim(),
  }),
});

// ─── Update Unit ──────────────────────────────────────────────────────────────
const updateUnitValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Unit name is required' })
      .min(1, 'Unit name is required')
      .max(50, 'Unit name cannot exceed 50 characters')
      .trim(),
  }),
});

// ─── Assign Tenant ────────────────────────────────────────────────────────────
const assignTenantValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Tenant name is required' })
      .min(1, 'Tenant name is required')
      .max(100, 'Tenant name cannot exceed 100 characters')
      .trim(),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(1, 'Phone number is required')
      .trim(),
    rentStartDate: z
      .string({ required_error: 'Rent start date is required' })
      .min(1, 'Rent start date is required'),
    rentAmount: z
      .number({ required_error: 'Rent amount is required' })
      .min(0, 'Rent amount cannot be negative'),
    waterBill: z.number().min(0).optional(),
    gasBill: z.number().min(0).optional(),
    otherBills: z.number().min(0).optional(),
  }),
});

export const PropertyValidation = {
  createPropertyValidationSchema,
  updatePropertyValidationSchema,
  addUnitValidationSchema,
  updateUnitValidationSchema,
  assignTenantValidationSchema,
  clearTenantValidationSchema,
};

// ─── Clear Tenant ─────────────────────────────────────────────────────────────
const clearTenantValidationSchema = z.object({
  body: z.object({
    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .trim()
      .optional(),
  }),
});
