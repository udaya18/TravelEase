import { useQuery } from '@tanstack/react-query';
import { flightApi } from '../api/flightApi';
import type { FlightSearchParams } from '../types/flight';

export const useFlights = (params?: FlightSearchParams) => {
  return useQuery({
    queryKey: ['flights', params],
    queryFn: () => params ? flightApi.searchFlights(params) : flightApi.getAllFlights(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useFlightById = (flightId: string) => {
  return useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => flightApi.getFlightById(flightId),
    enabled: !!flightId,
    staleTime: 10 * 60 * 1000,
  });
};
