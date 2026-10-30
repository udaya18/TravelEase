export interface Flight {
  flightId: string;
  airline: string;
  airlineCode: string;
  airlineLogo: string;
  flightNumber: string;
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopInfo?: string;
  price: number;
  originalPrice?: number;
  baggage: string;
  cabinBaggage: string;
  refundable: boolean;
  rating?: number;
  seatAvailability: number;
  cabinClass: string;
  amenities: string[];
  fareRules: FareRule[];
  cancellationPolicy: string;
}

export interface FareRule {
  title: string;
  description: string;
  icon: string;
}

export interface FlightSearchParams {
  from: string;
  to: string;
  departureDate: string;
  returnDate?: string;
  travellers: number;
  cabinClass: string;
  tripType: 'one-way' | 'round-trip';
}

export interface FlightFilters {
  priceRange: [number, number];
  airlines: string[];
  stops: number[];
  departureTimeRange: string[];
  arrivalTimeRange: string[];
  refundable: boolean | null;
}
