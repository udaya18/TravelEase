export interface Traveller {
  travellerId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  passportNumber?: string;
  nationality?: string;
  type: 'Adult' | 'Child' | 'Infant';
}

export interface ContactDetails {
  email: string;
  phone: string;
  countryCode: string;
}
