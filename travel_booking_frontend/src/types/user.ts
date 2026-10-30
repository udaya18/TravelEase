export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  preferences: UserPreferences;
  savedTravellers: SavedTraveller[];
  savedPaymentMethods: SavedPaymentMethod[];
  savedDestinations: string[];
  createdAt: string;
}

export interface UserPreferences {
  preferredAirline?: string;
  preferredCabinClass?: string;
  preferredHotelCategory?: string;
  mealPreference?: string;
  seatPreference?: string;
  newsletterSubscribed: boolean;
}

export interface SavedTraveller {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  passportNumber?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  label: string;
  last4?: string;
  upiId?: string;
  isDefault: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
