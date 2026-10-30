import axiosInstance from './axiosInstance';
import type { Flight, FlightSearchParams } from '../types/flight';
import { mockFlights } from '../data/flights';

const API_BASE_URL = 'http://localhost:8080/api';

const airportCityMap: Record<string, string> = {
  DEL: 'Delhi',
  BOM: 'Mumbai',
  BLR: 'Bengaluru',
  MAA: 'Chennai',
  HYD: 'Hyderabad',
  CCU: 'Kolkata',
  GOI: 'Goa',
  COK: 'Kochi',
  JAI: 'Jaipur',
  AMD: 'Ahmedabad',
  PNQ: 'Pune',
  VGA: 'Vijayawada',
  VTZ: 'Visakhapatnam',
};

const cityAirportMap: Record<string, string> = {
  DELHI: 'DEL',
  NEWDELHI: 'DEL',
  MUMBAI: 'BOM',
  BOMBAY: 'BOM',
  BENGALURU: 'BLR',
  BANGALORE: 'BLR',
  CHENNAI: 'MAA',
  MADRAS: 'MAA',
  HYDERABAD: 'HYD',
  KOLKATA: 'CCU',
  CALCUTTA: 'CCU',
  GOA: 'GOI',
  KOCHI: 'COK',
  COCHIN: 'COK',
  JAIPUR: 'JAI',
  AHMEDABAD: 'AMD',
  PUNE: 'PNQ',
  VIJAYAWADA: 'VGA',
  VISAKHAPATNAM: 'VTZ',
  VIZAG: 'VTZ',
};

const airlineCodes: Record<string, string> = {
  IndiGo: '6E',
  'Air India': 'AI',
  Vistara: 'UK',
  'Akasa Air': 'QP',
  SpiceJet: 'SG',
};

const airlineLogos: Record<string, string> = {
  IndiGo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/IndiGo_Airlines_logo.svg/200px-IndiGo_Airlines_logo.svg.png',
  'Air India': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/Air_India_Logo.svg/120px-Air_India_Logo.svg.png',
  Vistara: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Vistara-logo.svg/200px-Vistara-logo.svg.png',
  'Akasa Air': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Akasa_Air_logo.svg/200px-Akasa_Air_logo.svg.png',
  SpiceJet: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/SpiceJet_logo.svg/200px-SpiceJet_logo.svg.png',
};

const resolveCityAndAirport = (val?: string): { city: string; code: string } => {
  if (!val) return { city: 'Delhi', code: 'DEL' };
  const str = val.trim();
  
  // Extract 3-letter IATA code from parentheses like (HYD)
  const parenMatch = str.match(/\(([A-Za-z0-9]{3})\)/);
  if (parenMatch) {
    const code = parenMatch[1].toUpperCase();
    const city = airportCityMap[code] || str.split('(')[0].trim();
    return { city, code };
  }

  const upper = str.toUpperCase();
  if (airportCityMap[upper]) {
    return { city: airportCityMap[upper], code: upper };
  }
  const cleanCity = upper.replace(/\s+/g, '');
  if (cityAirportMap[cleanCity]) {
    return { city: str, code: cityAirportMap[cleanCity] };
  }
  return { city: str, code: upper.slice(0, 3) };
};

const mapBackendFlight = (f: any): Flight => {
  const fromInfo = resolveCityAndAirport(f.source);
  const toInfo = resolveCityAndAirport(f.destination);
  const airline = f.airline || 'IndiGo';
  const flightNumber = f.flightNumber || 'FL-100';
  const airlineCode = airlineCodes[airline] || (flightNumber.split('-')[0].slice(0, 2));

  return {
    flightId: String(f.flightId ?? f.id),
    airline,
    airlineCode,
    airlineLogo: airlineLogos[airline] || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=100',
    flightNumber,
    from: fromInfo.code,
    fromCity: fromInfo.city,
    to: toInfo.code,
    toCity: toInfo.city,
    departureTime: f.departureTime || '06:00',
    arrivalTime: f.arrivalTime || '08:15',
    duration: f.duration || '2h 15m',
    stops: f.stops ?? 0,
    price: f.price || 4500,
    baggage: '15 kg',
    cabinBaggage: '7 kg',
    refundable: true,
    rating: f.rating || 4.2,
    seatAvailability: f.availableSeats ?? 45,
    cabinClass: 'Economy',
    amenities: ['In-flight Entertainment', 'Meals Available', 'USB Power Port'],
    fareRules: [
      { title: 'Cancellation', description: 'Fee applies if cancelled within 24h of departure', icon: 'AlertCircle' },
      { title: 'Date Change', description: 'Permitted up to 4 hours before departure', icon: 'RefreshCw' },
    ],
    cancellationPolicy: 'Standard Airlines Cancellation Policy applies',
  };
};

const cleanLocation = (val?: string) => {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.includes('(')) {
    return trimmed.split('(')[0].trim();
  }
  if (trimmed.includes('-')) {
    return trimmed.split('-')[0].trim();
  }
  return trimmed;
};

export const flightApi = {
  searchFlights: async (params: FlightSearchParams): Promise<Flight[]> => {
    const cleanFrom = cleanLocation(params.from);
    const cleanTo = cleanLocation(params.to);

    const response = await axiosInstance.get('/flights/search', {
      params: {
        source: cleanFrom || undefined,
        destination: cleanTo || undefined,
      },
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return data.map(mapBackendFlight);
    }
    return [];
  },

  getFlightById: async (flightId: string): Promise<Flight | undefined> => {
    try {
      const response = await axiosInstance.get(`/flights/${flightId}`);
      if (response.data) {
        return mapBackendFlight(response.data);
      }
    } catch (err) {
      console.error(`Error fetching flight ${flightId}:`, err);
    }
    return undefined;
  },

  getAllFlights: async (): Promise<Flight[]> => {
    const response = await axiosInstance.get('/flights');
    if (Array.isArray(response.data)) {
      return response.data.map(mapBackendFlight);
    }
    return [];
  },
};

export { API_BASE_URL };
