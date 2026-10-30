import axiosInstance from './axiosInstance';
import type { Flight } from '../types/flight';
import type { Cab } from '../types/cab';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RankingCriteria = 'BALANCED' | 'LOWEST_RISK' | 'FASTEST' | 'BUDGET';

export interface RiskScoreDetails {
  riskScore: number;
  riskLevel: RiskLevel;
  disruptionRisk: number;
  transferRisk: number;
  punctualityScore: number;
  priceScore: number;
  durationScore: number;
  recommendationScore: number;
  rank: number;
  explanations: string[];
  telemetry?: Record<string, any>;
}

export interface RiskRankedFlightResponse {
  flight: Flight;
  riskDetails: RiskScoreDetails;
}

export interface RiskRankedCabResponse {
  cab: Cab;
  riskDetails: RiskScoreDetails;
}

export interface ItineraryRiskRequest {
  flightId?: number | string;
  hotelId?: number | string;
  cabId?: number | string;
  travelDate?: string;
  cabPickupTime?: string;
}

export interface ItineraryRiskResponse {
  overallTripRiskScore: number;
  overallTripRiskLevel: RiskLevel;
  compositeRecommendationScore: number;
  flightRisk?: RiskScoreDetails;
  cabRisk?: RiskScoreDetails;
  hotelRisk?: RiskScoreDetails;
  transferBufferMinutes: number;
  transferBufferAssessment: string;
  tripLevelExplanations: string[];
  actionableMitigations: string[];
}

export const riskApi = {
  rankFlights: async (source?: string, destination?: string, criteria: RankingCriteria = 'BALANCED'): Promise<RiskRankedFlightResponse[]> => {
    try {
      const response = await axiosInstance.get('/risk/rank-flights', {
        params: {
          source: source || undefined,
          destination: destination || undefined,
          criteria,
        },
      });
      return response.data;
    } catch (err) {
      console.error('Error fetching risk-ranked flights:', err);
      return [];
    }
  },

  getFlightRisk: async (flightId: string | number): Promise<RiskRankedFlightResponse | null> => {
    try {
      const response = await axiosInstance.get(`/risk/flight/${flightId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching risk for flight ${flightId}:`, err);
      return null;
    }
  },

  getCabRisk: async (cabId: string | number): Promise<RiskRankedCabResponse | null> => {
    try {
      const response = await axiosInstance.get(`/risk/cab/${cabId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching risk for cab ${cabId}:`, err);
      return null;
    }
  },

  assessItinerary: async (req: ItineraryRiskRequest): Promise<ItineraryRiskResponse | null> => {
    try {
      const cleanReq = {
        flightId: req.flightId ? Number(String(req.flightId).replace('FL-', '').replace('F-', '')) : undefined,
        hotelId: req.hotelId ? Number(String(req.hotelId).replace('HT-', '').replace('H-', '')) : undefined,
        cabId: req.cabId ? Number(String(req.cabId).replace('CAB-', '').replace('C-', '')) : undefined,
        travelDate: req.travelDate,
        cabPickupTime: req.cabPickupTime,
      };
      const response = await axiosInstance.post('/risk/assess-itinerary', cleanReq);
      return response.data;
    } catch (err) {
      console.error('Error assessing itinerary risk:', err);
      return null;
    }
  },
};
