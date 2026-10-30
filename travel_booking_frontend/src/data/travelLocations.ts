export interface AirportOption {
  city: string;
  code: string;
  airportName: string;
  label: string; // e.g. "Hyderabad (HYD) - Rajiv Gandhi International Airport"
}

export const AIRPORT_LOCATIONS: AirportOption[] = [
  { city: 'Hyderabad', code: 'HYD', airportName: 'Rajiv Gandhi International Airport', label: 'Hyderabad (HYD) - Rajiv Gandhi International Airport' },
  { city: 'Vijayawada', code: 'VGA', airportName: 'Vijayawada International Airport', label: 'Vijayawada (VGA) - Vijayawada International Airport' },
  { city: 'Bengaluru', code: 'BLR', airportName: 'Kempegowda International Airport', label: 'Bengaluru (BLR) - Kempegowda International Airport' },
  { city: 'Chennai', code: 'MAA', airportName: 'Chennai International Airport', label: 'Chennai (MAA) - Chennai International Airport' },
  { city: 'Mumbai', code: 'BOM', airportName: 'Chhatrapati Shivaji Maharaj International Airport', label: 'Mumbai (BOM) - Chhatrapati Shivaji Maharaj International Airport' },
  { city: 'Delhi', code: 'DEL', airportName: 'Indira Gandhi International Airport', label: 'Delhi (DEL) - Indira Gandhi International Airport' },
  { city: 'Visakhapatnam', code: 'VTZ', airportName: 'Visakhapatnam International Airport', label: 'Visakhapatnam (VTZ) - Visakhapatnam International Airport' },
  { city: 'Kolkata', code: 'CCU', airportName: 'Netaji Subhash Chandra Bose International Airport', label: 'Kolkata (CCU) - Netaji Subhash Chandra Bose International Airport' },
  { city: 'Pune', code: 'PNQ', airportName: 'Pune International Airport', label: 'Pune (PNQ) - Pune International Airport' },
  { city: 'Kochi', code: 'COK', airportName: 'Cochin International Airport', label: 'Kochi (COK) - Cochin International Airport' },
  { city: 'Goa', code: 'GOI', airportName: 'Dabolim Airport', label: 'Goa (GOI) - Dabolim Airport' },
  { city: 'Jaipur', code: 'JAI', airportName: 'Jaipur International Airport', label: 'Jaipur (JAI) - Jaipur International Airport' },
  { city: 'Ahmedabad', code: 'AMD', airportName: 'Sardar Vallabhbhai Patel International Airport', label: 'Ahmedabad (AMD) - Sardar Vallabhbhai Patel International Airport' },
];

export interface HotelDestinationOption {
  city: string;
  state: string;
  label: string;
}

export const HOTEL_DESTINATIONS: HotelDestinationOption[] = [
  { city: 'Hyderabad', state: 'Telangana', label: 'Hyderabad, Telangana' },
  { city: 'Vijayawada', state: 'Andhra Pradesh', label: 'Vijayawada, Andhra Pradesh' },
  { city: 'Bengaluru', state: 'Karnataka', label: 'Bengaluru, Karnataka' },
  { city: 'Chennai', state: 'Tamil Nadu', label: 'Chennai, Tamil Nadu' },
  { city: 'Mumbai', state: 'Maharashtra', label: 'Mumbai, Maharashtra' },
  { city: 'Delhi', state: 'National Capital Region', label: 'Delhi (NCR)' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', label: 'Visakhapatnam, Andhra Pradesh' },
  { city: 'Kolkata', state: 'West Bengal', label: 'Kolkata, West Bengal' },
  { city: 'Pune', state: 'Maharashtra', label: 'Pune, Maharashtra' },
  { city: 'Kochi', state: 'Kerala', label: 'Kochi, Kerala' },
  { city: 'Goa', state: 'Goa', label: 'Goa, Beachfront' },
  { city: 'Jaipur', state: 'Rajasthan', label: 'Jaipur, Rajasthan' },
  { city: 'Ahmedabad', state: 'Gujarat', label: 'Ahmedabad, Gujarat' },
];

export interface CabLocationOption {
  location: string;
  city: string;
  type: 'Airport' | 'Railway Station' | 'Popular Area';
}

export const CAB_PICKUP_LOCATIONS: CabLocationOption[] = [
  // Hyderabad
  { location: 'Hyderabad Airport (RGIA)', city: 'Hyderabad', type: 'Airport' },
  { location: 'Secunderabad Railway Station', city: 'Hyderabad', type: 'Railway Station' },
  { location: 'Hitech City, Hyderabad', city: 'Hyderabad', type: 'Popular Area' },
  { location: 'Banjara Hills, Hyderabad', city: 'Hyderabad', type: 'Popular Area' },

  // Vijayawada
  { location: 'Vijayawada Airport (Gannavaram)', city: 'Vijayawada', type: 'Airport' },
  { location: 'Vijayawada Railway Station', city: 'Vijayawada', type: 'Railway Station' },
  { location: 'Benz Circle, Vijayawada', city: 'Vijayawada', type: 'Popular Area' },

  // Bengaluru
  { location: 'Bengaluru Airport (KIA)', city: 'Bengaluru', type: 'Airport' },
  { location: 'Koramangala, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'Indiranagar, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'Whitefield, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },

  // Chennai
  { location: 'Chennai Airport (MAA)', city: 'Chennai', type: 'Airport' },
  { location: 'Chennai Central Station', city: 'Chennai', type: 'Railway Station' },
  { location: 'T Nagar, Chennai', city: 'Chennai', type: 'Popular Area' },
  { location: 'OMR IT Corridor, Chennai', city: 'Chennai', type: 'Popular Area' },

  // Mumbai
  { location: 'Mumbai Airport (T2)', city: 'Mumbai', type: 'Airport' },
  { location: 'Andheri West, Mumbai', city: 'Mumbai', type: 'Popular Area' },
  { location: 'Bandra Kurla Complex (BKC), Mumbai', city: 'Mumbai', type: 'Popular Area' },
  { location: 'South Mumbai (Colaba)', city: 'Mumbai', type: 'Popular Area' },

  // Delhi
  { location: 'Delhi Airport (T3)', city: 'Delhi', type: 'Airport' },
  { location: 'New Delhi Railway Station', city: 'Delhi', type: 'Railway Station' },
  { location: 'Connaught Place, Delhi', city: 'Delhi', type: 'Popular Area' },
  { location: 'Gurgaon Cyber Hub', city: 'Delhi', type: 'Popular Area' },

  // Visakhapatnam
  { location: 'Visakhapatnam Airport (VTZ)', city: 'Visakhapatnam', type: 'Airport' },
  { location: 'Vizag Railway Station', city: 'Visakhapatnam', type: 'Railway Station' },
  { location: 'Beach Road, Visakhapatnam', city: 'Visakhapatnam', type: 'Popular Area' },

  // Kolkata
  { location: 'Kolkata Airport (CCU)', city: 'Kolkata', type: 'Airport' },
  { location: 'Howrah Railway Station', city: 'Kolkata', type: 'Railway Station' },
  { location: 'Park Street, Kolkata', city: 'Kolkata', type: 'Popular Area' },

  // Pune
  { location: 'Pune Airport (PNQ)', city: 'Pune', type: 'Airport' },
  { location: 'Pune Railway Station', city: 'Pune', type: 'Railway Station' },
  { location: 'Hinjewadi IT Park, Pune', city: 'Pune', type: 'Popular Area' },

  // Kochi
  { location: 'Kochi Airport (COK)', city: 'Kochi', type: 'Airport' },
  { location: 'Ernakulam South Station', city: 'Kochi', type: 'Railway Station' },
  { location: 'Fort Kochi', city: 'Kochi', type: 'Popular Area' },
];

export const CAB_DROP_LOCATIONS: CabLocationOption[] = [
  // Hyderabad
  { location: 'Hitech City, Hyderabad', city: 'Hyderabad', type: 'Popular Area' },
  { location: 'Gachibowli, Hyderabad', city: 'Hyderabad', type: 'Popular Area' },
  { location: 'Banjara Hills, Hyderabad', city: 'Hyderabad', type: 'Popular Area' },
  { location: 'Jubilee Hills, Hyderabad', city: 'Hyderabad', type: 'Popular Area' },
  { location: 'Hyderabad Airport (RGIA)', city: 'Hyderabad', type: 'Airport' },

  // Vijayawada
  { location: 'Benz Circle, Vijayawada', city: 'Vijayawada', type: 'Popular Area' },
  { location: 'MG Road, Vijayawada', city: 'Vijayawada', type: 'Popular Area' },
  { location: 'Kanaka Durga Temple, Vijayawada', city: 'Vijayawada', type: 'Popular Area' },
  { location: 'Amaravati Secretariat', city: 'Vijayawada', type: 'Popular Area' },
  { location: 'Vijayawada Airport (Gannavaram)', city: 'Vijayawada', type: 'Airport' },

  // Bengaluru
  { location: 'Koramangala, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'Indiranagar, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'Whitefield, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'Electronic City, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'MG Road, Bengaluru', city: 'Bengaluru', type: 'Popular Area' },
  { location: 'Bengaluru Airport (KIA)', city: 'Bengaluru', type: 'Airport' },

  // Chennai
  { location: 'T Nagar, Chennai', city: 'Chennai', type: 'Popular Area' },
  { location: 'OMR IT Corridor, Chennai', city: 'Chennai', type: 'Popular Area' },
  { location: 'Anna Nagar, Chennai', city: 'Chennai', type: 'Popular Area' },
  { location: 'Marina Beach, Chennai', city: 'Chennai', type: 'Popular Area' },
  { location: 'Chennai Airport (MAA)', city: 'Chennai', type: 'Airport' },

  // Mumbai
  { location: 'Andheri West, Mumbai', city: 'Mumbai', type: 'Popular Area' },
  { location: 'Bandra Kurla Complex (BKC), Mumbai', city: 'Mumbai', type: 'Popular Area' },
  { location: 'South Mumbai (Colaba)', city: 'Mumbai', type: 'Popular Area' },
  { location: 'Dadar, Mumbai', city: 'Mumbai', type: 'Popular Area' },
  { location: 'Mumbai Airport (T2)', city: 'Mumbai', type: 'Airport' },

  // Delhi
  { location: 'Connaught Place, Delhi', city: 'Delhi', type: 'Popular Area' },
  { location: 'Gurgaon Cyber Hub', city: 'Delhi', type: 'Popular Area' },
  { location: 'Noida Sector 62', city: 'Delhi', type: 'Popular Area' },
  { location: 'Delhi Airport (T3)', city: 'Delhi', type: 'Airport' },

  // Visakhapatnam
  { location: 'Beach Road, Visakhapatnam', city: 'Visakhapatnam', type: 'Popular Area' },
  { location: 'Siripuram, Visakhapatnam', city: 'Visakhapatnam', type: 'Popular Area' },
  { location: 'Madhurawada IT SEZ, Visakhapatnam', city: 'Visakhapatnam', type: 'Popular Area' },
  { location: 'Gajuwaka, Visakhapatnam', city: 'Visakhapatnam', type: 'Popular Area' },
  { location: 'Visakhapatnam Airport (VTZ)', city: 'Visakhapatnam', type: 'Airport' },

  // Kolkata
  { location: 'Park Street, Kolkata', city: 'Kolkata', type: 'Popular Area' },
  { location: 'Salt Lake Sector V, Kolkata', city: 'Kolkata', type: 'Popular Area' },
  { location: 'New Town, Kolkata', city: 'Kolkata', type: 'Popular Area' },
  { location: 'Howrah Railway Station', city: 'Kolkata', type: 'Railway Station' },
  { location: 'Kolkata Airport (CCU)', city: 'Kolkata', type: 'Airport' },

  // Pune
  { location: 'Hinjewadi IT Park, Pune', city: 'Pune', type: 'Popular Area' },
  { location: 'Koregaon Park, Pune', city: 'Pune', type: 'Popular Area' },
  { location: 'Viman Nagar, Pune', city: 'Pune', type: 'Popular Area' },
  { location: 'Kothrud, Pune', city: 'Pune', type: 'Popular Area' },
  { location: 'Pune Airport (PNQ)', city: 'Pune', type: 'Airport' },

  // Kochi
  { location: 'Fort Kochi', city: 'Kochi', type: 'Popular Area' },
  { location: 'Marine Drive, Kochi', city: 'Kochi', type: 'Popular Area' },
  { location: 'Kakkanad Infopark, Kochi', city: 'Kochi', type: 'Popular Area' },
  { location: 'Edappally (Lulu Mall), Kochi', city: 'Kochi', type: 'Popular Area' },
  { location: 'Kochi Airport (COK)', city: 'Kochi', type: 'Airport' },
];
