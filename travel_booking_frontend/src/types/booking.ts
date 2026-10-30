import type { Traveller, ContactDetails } from './traveller';

export type BookingType = 'flight' | 'hotel' | 'cab' | 'package' | 'itinerary';
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'WALLET' | 'DEMO' | 'CARD' | 'RAZORPAY';
export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'DEMO_PAID' | 'CANCELLED';

export interface PriceBreakdown {
  baseFare: number;
  taxes: number;
  convenienceFee: number;
  discount: number;
  total: number;
}

export interface Booking {
  bookingId: string;
  bookingReference?: string;
  bookingType: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  travellers: Traveller[];
  contactDetails: ContactDetails;
  priceBreakdown: PriceBreakdown;
  bookedAt: string;
  travelDate: string;
  destination: string;
  summary: string;
  flightDetails?: FlightBookingDetails;
  hotelDetails?: HotelBookingDetails;
  cabDetails?: CabBookingDetails;
}

export interface FlightBookingDetails {
  flightId: string;
  airline: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  cabinClass: string;
  seats: number;
}

export interface HotelBookingDetails {
  hotelId: string;
  hotelName: string;
  location: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  rooms: number;
}

export interface CabBookingDetails {
  cabId: string;
  vehicleName: string;
  cabType: string;
  pickup: string;
  drop: string;
  pickupDate: string;
  pickupTime: string;
}
