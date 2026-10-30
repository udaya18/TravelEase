import axiosInstance from './axiosInstance';
import type { Cab, CabSearchParams } from '../types/cab';
import { mockCabs } from '../data/cabs';

const cabImages: Record<string, string> = {
  Sedan: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
  SUV: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800',
  Hatchback: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
  Premium: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
  Mini: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
};

const mapBackendCab = (c: any): Cab => {
  const type = c.cabType || 'Sedan';
  const price = c.price || 850;
  return {
    cabId: String(c.cabId ?? c.id),
    vehicleName: `${c.provider || 'Cab'} ${type}`,
    cabType: (type as any),
    seats: c.capacity || (type === 'SUV' ? 6 : 4),
    isAC: true,
    pickup: c.pickupLocation || 'Airport',
    drop: c.dropLocation || 'City Center',
    estimatedDuration: c.estimatedDuration || '45 mins',
    distance: '25 km',
    driverRating: 4.8,
    baseFare: price,
    perKmFare: 14,
    totalFare: price,
    image: cabImages[type] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    amenities: ['Air Conditioned', 'Clean & Sanitized', 'Top Rated Driver', 'Luggage Assistance'],
    cancellationPolicy: 'Free cancellation up to 1 hour before pickup',
    operator: c.provider || 'TravelEase Cabs',
  };
};

export const cabApi = {
  searchCabs: async (params: CabSearchParams): Promise<Cab[]> => {
    const pickup = params.pickup?.trim();
    const drop = params.drop?.trim();

    const response = await axiosInstance.get('/cabs/search', {
      params: {
        pickupLocation: pickup || undefined,
        dropLocation: drop || undefined,
      },
    });
    if (Array.isArray(response.data)) {
      return response.data.map((c) => ({
        ...mapBackendCab(c),
        pickup: pickup || c.pickupLocation || 'Airport',
        drop: drop || c.dropLocation || 'City Center',
      }));
    }
    return [];
  },

  getCabById: async (cabId: string): Promise<Cab | undefined> => {
    try {
      const response = await axiosInstance.get(`/cabs/${cabId}`);
      if (response.data) {
        return mapBackendCab(response.data);
      }
    } catch (err) {
      console.error(`Error fetching cab ${cabId}:`, err);
    }
    return undefined;
  },

  getAllCabs: async (): Promise<Cab[]> => {
    const response = await axiosInstance.get('/cabs');
    if (Array.isArray(response.data)) {
      return response.data.map(mapBackendCab);
    }
    return [];
  },
};
