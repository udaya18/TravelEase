export interface TravelAlert {
  alertId: string;
  type: 'info' | 'warning' | 'success' | 'important';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  bookingId?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export const mockAlerts: TravelAlert[] = [
  {
    alertId: 'ALT-001',
    type: 'important',
    title: 'Flight Departure Reminder',
    message: 'Your flight AI 101 HYD → DEL departs in 3 hours. Please proceed to the airport.',
    time: '2026-09-22T18:00:00',
    isRead: false,
    bookingId: 'TE-2026-100001',
    actionLabel: 'View Booking',
    actionUrl: '/bookings/TE-2026-100001',
  },
  {
    alertId: 'ALT-002',
    type: 'info',
    title: 'Hotel Check-in Tomorrow',
    message: 'Hotel check-in at The Grand Hyderabad is tomorrow at 2:00 PM. Your room is confirmed.',
    time: '2026-09-22T10:00:00',
    isRead: false,
    bookingId: 'TE-2026-100002',
    actionLabel: 'View Hotel',
    actionUrl: '/bookings/TE-2026-100002',
  },
  {
    alertId: 'ALT-003',
    type: 'warning',
    title: 'Cab Pickup in 1 Hour',
    message: 'Your cab pickup from Hyderabad Airport is scheduled for 6:30 AM. Driver will arrive soon.',
    time: '2026-09-22T05:30:00',
    isRead: true,
    bookingId: 'TE-2026-100003',
    actionLabel: 'Track Cab',
    actionUrl: '/bookings/TE-2026-100003',
  },
  {
    alertId: 'ALT-004',
    type: 'warning',
    title: 'Flight Delay Notice',
    message: 'Flight AI 123 has a 20-minute delay. New departure time is 08:50. We apologize for the inconvenience.',
    time: '2026-09-21T08:30:00',
    isRead: true,
    bookingId: 'TE-2026-100004',
  },
  {
    alertId: 'ALT-005',
    type: 'success',
    title: 'Booking Confirmed',
    message: 'Your booking TE-2026-100005 for Goa Beach Resort & Spa has been confirmed successfully.',
    time: '2026-09-20T14:00:00',
    isRead: true,
    bookingId: 'TE-2026-100005',
    actionLabel: 'View Details',
    actionUrl: '/bookings/TE-2026-100005',
  },
  {
    alertId: 'ALT-006',
    type: 'info',
    title: 'Web Check-in Available',
    message: 'Web check-in is now open for your flight 6E 202 on 25th September. Check in now to choose your seat.',
    time: '2026-09-20T09:00:00',
    isRead: true,
    bookingId: 'TE-2026-100006',
    actionLabel: 'Web Check-in',
    actionUrl: '/bookings/TE-2026-100006',
  },
];
