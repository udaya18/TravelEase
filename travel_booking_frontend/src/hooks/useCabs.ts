import { useQuery } from '@tanstack/react-query';
import { cabApi } from '../api/cabApi';
import type { CabSearchParams } from '../types/cab';

export const useCabs = (params?: CabSearchParams) => {
  return useQuery({
    queryKey: ['cabs', params],
    queryFn: () => params ? cabApi.searchCabs(params) : cabApi.getAllCabs(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useCabById = (cabId: string) => {
  return useQuery({
    queryKey: ['cab', cabId],
    queryFn: () => cabApi.getCabById(cabId),
    enabled: !!cabId,
  });
};
