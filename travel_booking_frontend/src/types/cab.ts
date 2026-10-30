export interface Cab {
  cabId: string;
  vehicleName: string;
  cabType: 'Mini' | 'Sedan' | 'SUV' | 'Premium';
  image: string;
  seats: number;
  isAC: boolean;
  pickup: string;
  drop: string;
  estimatedDuration: string;
  distance: string;
  driverRating: number;
  baseFare: number;
  perKmFare: number;
  totalFare: number;
  amenities: string[];
  cancellationPolicy: string;
  operator: string;
}

export interface CabSearchParams {
  pickup: string;
  drop: string;
  date: string;
  time: string;
}

export interface CabFilters {
  cabTypes: string[];
  priceRange: [number, number];
  isAC: boolean | null;
  minRating: number;
}
