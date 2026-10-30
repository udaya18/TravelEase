import { useTravelStore } from '../store/travelStore';
import type { Booking } from '../types/booking';

export const useBookings = () => {
  const bookings = useTravelStore((s) => s.bookings);
  const cancelBooking = useTravelStore((s) => s.cancelBooking);

  const getUpcoming = () =>
    bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');

  const getCompleted = () =>
    bookings.filter((b) => b.status === 'COMPLETED');

  const getCancelled = () =>
    bookings.filter((b) => b.status === 'CANCELLED');

  const getById = (id: string): Booking | undefined =>
    bookings.find((b) => b.bookingId === id);

  return {
    bookings,
    getUpcoming,
    getCompleted,
    getCancelled,
    getById,
    cancelBooking,
  };
};
