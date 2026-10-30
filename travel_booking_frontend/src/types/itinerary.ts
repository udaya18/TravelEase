export type ItineraryItemType = 'flight' | 'hotel' | 'cab' | 'activity';

export interface ItineraryItem {
  itemId: string;
  day: number;
  type: ItineraryItemType;
  title: string;
  description: string;
  time?: string;
  duration?: string;
  location?: string;
  price: number;
  details: Record<string, string | number | boolean>;
}

export interface Itinerary {
  tripId: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  travellers: number;
  items: ItineraryItem[];
  totalBudget: number;
  notes?: string;
}
