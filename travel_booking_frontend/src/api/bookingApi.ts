import axiosInstance from './axiosInstance';
import type { Booking, BookingType, PaymentStatus, BookingStatus } from '../types/booking';

export const bookingApi = {
  createBooking: async (booking: Omit<Booking, 'bookingId' | 'bookedAt'>, userId?: string | number): Promise<Booking> => {
    const firstTraveller = booking.travellers?.[0];

    const parseServiceId = (id: any): number | null => {
      if (!id) return null;
      const num = Number(id);
      if (!isNaN(num) && num > 0) return num;
      const match = String(id).match(/\d+/);
      if (match) {
        const parsed = parseInt(match[0], 10);
        return parsed > 0 ? parsed : null;
      }
      return null;
    };

    const fId = parseServiceId(booking.flightDetails?.flightId);
    const hId = parseServiceId(booking.hotelDetails?.hotelId);
    const cId = parseServiceId(booking.cabDetails?.cabId);

    if (!fId && !hId && !cId) {
      throw new Error('Please select at least one travel service (flight, hotel, or cab) before checkout.');
    }

    const payload = {
      userId: userId ? Number(userId) : undefined,
      flightId: fId,
      hotelId:  hId,
      cabId:    cId,
      travellerName: firstTraveller
        ? `${firstTraveller.firstName} ${firstTraveller.lastName}`.trim()
        : (booking.contactDetails?.email || 'Traveler'),
      travellerEmail: booking.contactDetails?.email || 'traveler@example.com',
      travellerPhone: booking.contactDetails?.phone || '',
      travelDate: booking.travelDate || new Date().toISOString().split('T')[0],
      paymentMethod: booking.paymentMethod || 'CARD',
    };

    const response = await axiosInstance.post('/bookings', payload);
    const resData = response.data;

    const newBooking: Booking = {
      ...booking,
      bookingId: `TE-${resData.bookingId}`,
      bookingReference: resData.bookingReference || `TE-${resData.bookingId}`,
      bookedAt: resData.createdAt || new Date().toISOString(),
      status: (resData.bookingStatus || 'PENDING') as BookingStatus,
      paymentStatus: (resData.paymentStatus || 'PENDING') as PaymentStatus,
      transactionReference: resData.transactionReference,
    };
    return newBooking;
  },

  getUserBookings: async (userId: string | number): Promise<Booking[]> => {
    try {
      const response = await axiosInstance.get(`/bookings/user/${userId}`);
      if (Array.isArray(response.data)) {
        return response.data.map((b: any) => {
          const type: BookingType = b.flightId && b.hotelId ? 'package' : b.flightId ? 'flight' : b.hotelId ? 'hotel' : b.cabId ? 'cab' : 'flight';
          const ref = b.bookingReference || `TE-${b.bookingId}`;
          const names = (b.travellerName || 'Traveler').split(' ');
          const fName = names[0] || 'Traveler';
          const lName = names.slice(1).join(' ') || '';

          return {
            bookingId: `TE-${b.bookingId || b.id}`,
            bookingReference: ref,
            bookingType: type,
            status: (b.bookingStatus || 'CONFIRMED') as BookingStatus,
            paymentStatus: (b.paymentStatus || 'DEMO_PAID') as PaymentStatus,
            paymentMethod: b.paymentMethod || 'DEMO',
            transactionReference: b.transactionReference,
            travellers: [{
              travellerId: 'T-1',
              firstName: fName,
              lastName: lName,
              gender: 'Male',
              dateOfBirth: '1995-01-01',
              type: 'Adult',
            }],
            contactDetails: {
              email: b.travellerEmail || 'user@example.com',
              phone: b.travellerPhone || '9876543210',
              countryCode: '+91',
            },
            priceBreakdown: {
              baseFare: b.totalAmount || 0,
              taxes: 0,
              convenienceFee: 0,
              discount: 0,
              total: b.totalAmount || 0,
            },
            bookedAt: b.createdAt || new Date().toISOString(),
            travelDate: b.travelDate || new Date().toISOString().split('T')[0],
            destination: 'Travel Destination',
            summary: `${ref} · ${b.travellerName || 'Booking'}`,
          };
        });
      }
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      throw err;
    }
    return [];
  },

  getBookingById: async (bookingId: string): Promise<Booking | null> => {
    const numericId = bookingId.replace('TE-', '');
    try {
      const response = await axiosInstance.get(`/bookings/${numericId}`);
      if (response.data) {
        const b = response.data;
        const type: BookingType = b.flightId && b.hotelId ? 'package' : b.flightId ? 'flight' : b.hotelId ? 'hotel' : b.cabId ? 'cab' : 'flight';
        const ref = b.bookingReference || `TE-${b.bookingId}`;
        const names = (b.travellerName || 'Traveler').split(' ');
        const fName = names[0] || 'Traveler';
        const lName = names.slice(1).join(' ') || '';

        return {
          bookingId: `TE-${b.bookingId || b.id}`,
          bookingReference: ref,
          bookingType: type,
          status: (b.bookingStatus || 'CONFIRMED') as BookingStatus,
          paymentStatus: (b.paymentStatus || 'DEMO_PAID') as PaymentStatus,
          paymentMethod: b.paymentMethod || 'DEMO',
          transactionReference: b.transactionReference,
          travellers: [{
            travellerId: 'T-1',
            firstName: fName,
            lastName: lName,
            gender: 'Male',
            dateOfBirth: '1995-01-01',
            type: 'Adult',
          }],
          contactDetails: {
            email: b.travellerEmail || 'user@example.com',
            phone: b.travellerPhone || '9876543210',
            countryCode: '+91',
          },
          priceBreakdown: {
            baseFare: b.totalAmount || 0,
            taxes: 0,
            convenienceFee: 0,
            discount: 0,
            total: b.totalAmount || 0,
          },
          bookedAt: b.createdAt || new Date().toISOString(),
          travelDate: b.travelDate || new Date().toISOString().split('T')[0],
          destination: 'Travel Destination',
          summary: `${ref} · ${b.travellerName || 'Booking'}`,
        };
      }
    } catch (err) {
      console.error(`Error fetching booking ${bookingId}:`, err);
    }
    return null;
  },

  cancelBooking: async (bookingId: string): Promise<{ success: boolean; message?: string }> => {
    const numericId = bookingId.replace('TE-', '');
    try {
      await axiosInstance.put(`/bookings/${numericId}/status`, {
        bookingStatus: 'CANCELLED',
      });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel booking';
      console.error('Backend cancel booking error:', msg);
      return { success: false, message: msg };
    }
  },
};
