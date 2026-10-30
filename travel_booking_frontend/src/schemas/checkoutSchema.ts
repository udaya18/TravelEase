import { z } from 'zod';
import { travellerSchema } from './travellerSchema';

export const checkoutSchema = z.object({
  travellers: z.array(travellerSchema).min(1, 'At least one traveller is required'),
  contact: z.object({
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    countryCode: z.string().default('+91'),
  }),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
