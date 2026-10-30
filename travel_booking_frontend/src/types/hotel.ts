export interface Hotel {
  hotelId: string;
  hotelName: string;
  location: string;
  city: string;
  address: string;
  starRating: number;
  guestRating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  roomTypes: RoomType[];
  description: string;
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  cancellationPolicy: string;
  pricePerNight: number;
  originalPricePerNight?: number;
  propertyType: string;
  highlights: string[];
  checkInTime: string;
  checkOutTime: string;
}

export interface RoomType {
  roomId: string;
  roomName: string;
  bedType: string;
  maxGuests: number;
  pricePerNight: number;
  breakfastIncluded: boolean;
  freeCancellation: boolean;
  available: boolean;
  amenities: string[];
  size: string;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelFilters {
  priceRange: [number, number];
  starRating: number[];
  guestRating: number;
  propertyType: string[];
  amenities: string[];
  freeCancellation: boolean;
  breakfastIncluded: boolean;
}
