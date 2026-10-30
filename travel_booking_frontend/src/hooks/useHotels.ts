import { useQuery } from '@tanstack/react-query';
import { hotelApi } from '../api/hotelApi';
import type { HotelSearchParams } from '../types/hotel';

export const useHotels = (params?: HotelSearchParams) => {
  return useQuery({
    queryKey: ['hotels', params],
    queryFn: () => params ? hotelApi.searchHotels(params) : hotelApi.getAllHotels(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useHotelById = (hotelId: string) => {
  return useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelApi.getHotelById(hotelId),
    enabled: !!hotelId,
    staleTime: 10 * 60 * 1000,
  });
};
