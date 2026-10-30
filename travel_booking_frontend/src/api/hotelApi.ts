import axiosInstance from './axiosInstance';
import type { Hotel, HotelSearchParams } from '../types/hotel';
import { mockHotels } from '../data/hotels';

const defaultImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800',
];

const computeAmenities = (rating: number): string[] => {
  const base = ['Free WiFi', 'Restaurant', 'Room Service'];
  if (rating >= 4.2) {
    base.push('Gym', 'Valet Parking');
  }
  if (rating >= 4.5) {
    base.push('Swimming Pool', 'Spa');
  }
  if (rating >= 4.7) {
    base.push('Bar');
  }
  return base;
};

const mapBackendHotel = (h: any): Hotel => {
  const rating = Number(h.rating) || 4.5;
  const starRating = Math.min(5, Math.max(3, Math.round(rating)));

  return {
    hotelId: String(h.hotelId ?? h.id),
    hotelName: h.hotelName || h.name || 'Luxury Hotel',
    location: h.location || 'India',
    city: h.location || 'India',
    address: `${h.hotelName || 'Luxury Hotel'}, ${h.location || 'India'}`,
    starRating,
    guestRating: rating,
    reviewCount: Math.round(rating * 85) + 40,
    images: h.imageUrl && h.imageUrl.startsWith('http') ? [h.imageUrl, ...defaultImages] : defaultImages,
    amenities: computeAmenities(rating),
    description: h.description || 'Experience world-class hospitality, stunning views, modern amenities, and supreme comfort.',
    breakfastIncluded: true,
    freeCancellation: rating >= 4.0,
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    pricePerNight: h.pricePerNight || 6500,
    propertyType: 'Hotel',
    highlights: ['Top Rated Staff', 'Prime Location', 'High Cleanliness'],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    roomTypes: [
      {
        roomId: 'R-1',
        roomName: h.roomType || 'Deluxe Room',
        bedType: 'King Bed',
        maxGuests: 2,
        pricePerNight: h.pricePerNight || 6500,
        breakfastIncluded: true,
        freeCancellation: rating >= 4.0,
        available: (h.availableRooms ?? 10) > 0,
        amenities: ['King Bed', 'City/Garden View', 'Free WiFi', 'AC', 'Mini Bar'],
        size: '35 sq.m',
      },
      {
        roomId: 'R-2',
        roomName: 'Executive Suite',
        bedType: 'King Bed + Living Area',
        maxGuests: 3,
        pricePerNight: Math.round((h.pricePerNight || 6500) * 1.4),
        breakfastIncluded: true,
        freeCancellation: rating >= 4.0,
        available: (h.availableRooms ?? 10) > 1,
        amenities: ['King Bed', 'Living Area', 'Jacuzzi', 'Executive Lounge', 'Free Breakfast'],
        size: '55 sq.m',
      },
    ],
  };
};

export const hotelApi = {
  searchHotels: async (params: HotelSearchParams): Promise<Hotel[]> => {
    let dest = params.destination?.trim();
    if (dest && dest.includes(',')) {
      dest = dest.split(',')[0].trim();
    }
    const response = await axiosInstance.get('/hotels/search', {
      params: {
        location: dest || undefined,
      },
    });
    if (Array.isArray(response.data)) {
      return response.data.map(mapBackendHotel);
    }
    return [];
  },

  getHotelById: async (hotelId: string): Promise<Hotel | undefined> => {
    try {
      const response = await axiosInstance.get(`/hotels/${hotelId}`);
      if (response.data) {
        return mapBackendHotel(response.data);
      }
    } catch (err) {
      console.error(`Error fetching hotel ${hotelId}:`, err);
    }
    return undefined;
  },

  getAllHotels: async (): Promise<Hotel[]> => {
    const response = await axiosInstance.get('/hotels');
    if (Array.isArray(response.data)) {
      return response.data.map(mapBackendHotel);
    }
    return [];
  },
};
