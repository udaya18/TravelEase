export interface Destination {
  id: string;
  name: string;
  state: string;
  image: string;
  flightsFrom?: string;
  startingPrice: number;
  tags: string[];
  rating: number;
}

export const mockDestinations: Destination[] = [
  {
    id: 'dest-goa',
    name: 'Goa',
    state: 'Goa',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600',
    flightsFrom: 'HYD',
    startingPrice: 3500,
    tags: ['Beach', 'Nightlife', 'Adventure'],
    rating: 4.7,
  },
  {
    id: 'dest-hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
    flightsFrom: 'DEL',
    startingPrice: 2800,
    tags: ['Culture', 'Food', 'Heritage'],
    rating: 4.5,
  },
  {
    id: 'dest-bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600',
    flightsFrom: 'HYD',
    startingPrice: 2200,
    tags: ['City', 'Tech Hub', 'Gardens'],
    rating: 4.3,
  },
  {
    id: 'dest-mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=600',
    flightsFrom: 'HYD',
    startingPrice: 3000,
    tags: ['City', 'Bollywood', 'Beaches'],
    rating: 4.4,
  },
  {
    id: 'dest-delhi',
    name: 'Delhi',
    state: 'Delhi',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600',
    flightsFrom: 'HYD',
    startingPrice: 3500,
    tags: ['Capital', 'Heritage', 'Food'],
    rating: 4.2,
  },
  {
    id: 'dest-chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    image: 'https://images.unsplash.com/photo-1604404897237-3a40e003c01b?w=600',
    flightsFrom: 'HYD',
    startingPrice: 2000,
    tags: ['Beach', 'Culture', 'Temple'],
    rating: 4.3,
  },
  {
    id: 'dest-kochi',
    name: 'Kochi',
    state: 'Kerala',
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600',
    flightsFrom: 'HYD',
    startingPrice: 3200,
    tags: ['Backwaters', 'Culture', 'Seafood'],
    rating: 4.6,
  },
  {
    id: 'dest-jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600',
    flightsFrom: 'HYD',
    startingPrice: 4000,
    tags: ['Heritage', 'Culture', 'Shopping'],
    rating: 4.5,
  },
];
