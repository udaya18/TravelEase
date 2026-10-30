import { z } from 'zod';

export const travellerSchema = z.object({
  firstName: z.string().min(3, 'First name must be at least 3 characters').max(30),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(30),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Please select gender' }),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
});

export type TravellerFormData = z.infer<typeof travellerSchema>;
