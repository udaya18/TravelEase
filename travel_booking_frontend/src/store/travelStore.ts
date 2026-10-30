import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flight } from '../types/flight';
import type { Hotel, RoomType } from '../types/hotel';
import type { Cab } from '../types/cab';
import type { Traveller, ContactDetails } from '../types/traveller';
import type { Booking, PriceBreakdown, PaymentMethod } from '../types/booking';
import type { Itinerary, ItineraryItem } from '../types/itinerary';
import type { User } from '../types/user';
import { mockFlights } from '../data/flights';
import { mockHotels } from '../data/hotels';
import { mockCabs } from '../data/cabs';

interface TravelStore {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;

  // Selected travel options
  selectedFlight: Flight | null;
  selectedHotel: Hotel | null;
  selectedRoom: RoomType | null;
  selectedCab: Cab | null;

  // Search params
  flightSearchParams: Record<string, string | number> | null;
  hotelSearchParams: Record<string, string | number> | null;
  cabSearchParams: Record<string, string | number> | null;

  // Traveller and booking details
  travellers: Traveller[];
  contactDetails: ContactDetails | null;
  priceBreakdown: PriceBreakdown | null;
  selectedPaymentMethod: PaymentMethod | null;

  // Bookings
  bookings: Booking[];
  currentBooking: Booking | null;

  // Itinerary
  itinerary: Itinerary | null;

  // Alerts badge
  unreadAlertCount: number;

  // Actions
  selectFlight: (flight: Flight) => void;
  removeFlight: () => void;
  selectHotel: (hotel: Hotel) => void;
  removeHotel: () => void;
  selectRoom: (room: RoomType) => void;
  selectCab: (cab: Cab) => void;
  removeCab: () => void;
  clearSelections: () => void;
  loadSamplePackage: () => void;

  setFlightSearchParams: (params: Record<string, string | number>) => void;
  setHotelSearchParams: (params: Record<string, string | number>) => void;
  setCabSearchParams: (params: Record<string, string | number>) => void;

  setTravellerDetails: (travellers: Traveller[]) => void;
  setContactDetails: (contact: ContactDetails) => void;
  setPriceBreakdown: (price: PriceBreakdown) => void;
  setPaymentMethod: (method: PaymentMethod) => void;

  createBooking: (booking: Booking) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  cancelBooking: (bookingId: string) => void;
  clearBooking: () => void;

  // Itinerary
  initItinerary: (itinerary: Itinerary) => void;
  addToItinerary: (item: ItineraryItem) => void;
  removeFromItinerary: (itemId: string) => void;
  clearItinerary: () => void;
  saveItinerary: () => void;

  setUnreadAlertCount: (count: number) => void;
  decrementAlertCount: () => void;
}

export const useTravelStore = create<TravelStore>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('travelease_token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('travelease_token');
        set({ user: null, token: null, isAuthenticated: false, selectedFlight: null, selectedHotel: null, selectedCab: null });
      },

      // Selected options
      selectedFlight: null,
      selectedHotel: null,
      selectedRoom: null,
      selectedCab: null,

      // Search params
      flightSearchParams: null,
      hotelSearchParams: null,
      cabSearchParams: null,

      // Details
      travellers: [],
      contactDetails: null,
      priceBreakdown: null,
      selectedPaymentMethod: null,

      // Bookings (Real user bookings fetched from backend)
      bookings: [],
      currentBooking: null,

      // Itinerary
      itinerary: null,

      // Alerts
      unreadAlertCount: 2,

      // Actions
      selectFlight: (flight) => set({ selectedFlight: flight }),
      removeFlight: () => set({ selectedFlight: null }),
      selectHotel: (hotel) => set({ selectedHotel: hotel, selectedRoom: hotel.roomTypes?.[0] || null }),
      removeHotel: () => set({ selectedHotel: null, selectedRoom: null }),
      selectRoom: (room) => set({ selectedRoom: room }),
      selectCab: (cab) => set({ selectedCab: cab }),
      removeCab: () => set({ selectedCab: null }),
      clearSelections: () => set({ selectedFlight: null, selectedHotel: null, selectedRoom: null, selectedCab: null }),
      loadSamplePackage: () => {
        const sampleFlight = mockFlights[0];
        const sampleHotel = mockHotels[0];
        const sampleRoom = sampleHotel.roomTypes[0];
        const sampleCab = mockCabs[1] || mockCabs[0];
        set({
          selectedFlight: sampleFlight,
          selectedHotel: sampleHotel,
          selectedRoom: sampleRoom,
          selectedCab: sampleCab,
          flightSearchParams: {
            from: 'Hyderabad (HYD)',
            to: 'Delhi (DEL)',
            departureDate: '2026-10-15',
            travellers: 1,
            cabinClass: 'Economy',
          },
          hotelSearchParams: {
            city: 'Hyderabad',
            checkIn: '2026-10-15',
            checkOut: '2026-10-18',
            guests: 1,
            rooms: 1,
          },
          cabSearchParams: {
            pickup: 'Hyderabad Airport',
            drop: 'Banjara Hills',
            date: '2026-10-15',
            time: '10:00 AM',
          },
        });
      },

      setFlightSearchParams: (params) => set({ flightSearchParams: params }),
      setHotelSearchParams: (params) => set({ hotelSearchParams: params }),
      setCabSearchParams: (params) => set({ cabSearchParams: params }),

      setTravellerDetails: (travellers) => set({ travellers }),
      setContactDetails: (contact) => set({ contactDetails: contact }),
      setPriceBreakdown: (price) => set({ priceBreakdown: price }),
      setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

      createBooking: (booking) => {
        set((state) => ({
          bookings: [booking, ...state.bookings],
          currentBooking: booking,
        }));
      },
      updateBooking: (bookingId, updates) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.bookingId === bookingId || b.bookingReference === bookingId ? { ...b, ...updates } : b
          ),
          currentBooking:
            state.currentBooking &&
            (state.currentBooking.bookingId === bookingId || state.currentBooking.bookingReference === bookingId)
              ? { ...state.currentBooking, ...updates }
              : state.currentBooking,
        }));
      },
      setCurrentBooking: (booking) => set({ currentBooking: booking }),
      cancelBooking: (bookingId) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.bookingId === bookingId ? { ...b, status: 'CANCELLED' as const } : b
          ),
        }));
      },
      clearBooking: () =>
        set({
          selectedFlight: null,
          selectedHotel: null,
          selectedRoom: null,
          selectedCab: null,
          travellers: [],
          contactDetails: null,
          priceBreakdown: null,
          selectedPaymentMethod: null,
          currentBooking: null,
        }),

      // Itinerary
      initItinerary: (itinerary) => set({ itinerary }),
      addToItinerary: (item) => {
        set((state) => ({
          itinerary: state.itinerary
            ? { ...state.itinerary, items: [...state.itinerary.items, item] }
            : null,
        }));
      },
      removeFromItinerary: (itemId) => {
        set((state) => ({
          itinerary: state.itinerary
            ? { ...state.itinerary, items: state.itinerary.items.filter((i) => i.itemId !== itemId) }
            : null,
        }));
      },
      clearItinerary: () => set({ itinerary: null }),
      saveItinerary: () => {
        const { itinerary } = get();
        if (itinerary) {
          localStorage.setItem('travelease_itinerary', JSON.stringify(itinerary));
        }
      },

      setUnreadAlertCount: (count) => set({ unreadAlertCount: count }),
      decrementAlertCount: () =>
        set((state) => ({ unreadAlertCount: Math.max(0, state.unreadAlertCount - 1) })),
    }),
    {
      name: 'travelease-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        selectedFlight: state.selectedFlight,
        selectedHotel: state.selectedHotel,
        selectedRoom: state.selectedRoom,
        selectedCab: state.selectedCab,
        flightSearchParams: state.flightSearchParams,
        hotelSearchParams: state.hotelSearchParams,
        cabSearchParams: state.cabSearchParams,
        bookings: state.bookings,
        itinerary: state.itinerary,
        unreadAlertCount: state.unreadAlertCount,
      }),
    }
  )
);

// Real backend login helper for quick-login with seeded user
export const demoLogin = async (): Promise<boolean> => {
  try {
    const { authApi } = await import('../api/authApi');
    const res = await authApi.login('udayasri@email.com', 'password123');
    useTravelStore.getState().login(res.user, res.token);
    return true;
  } catch (err) {
    console.error('Failed to log in with backend user:', err);
    return false;
  }
};
