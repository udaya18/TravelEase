import { useNavigate } from 'react-router-dom';
import { Plane, Hotel, Car, Eye, Download, XCircle, Compass, CreditCard } from 'lucide-react';
import type { Booking } from '../types/booking';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void;
}

const typeIcons: Record<string, any> = { flight: Plane, hotel: Hotel, cab: Car, package: Compass, itinerary: Compass };
const statusClass: Record<string, string> = {
  CONFIRMED: 'status-confirmed',
  PENDING: 'status-pending',
  CANCELLED: 'status-cancelled',
  COMPLETED: 'status-completed',
};

export default function BookingCard({ booking, onCancel }: BookingCardProps) {
  const navigate = useNavigate();
  const Icon = typeIcons[booking.bookingType] || Plane;

  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="booking-id">{booking.bookingId}</span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
            {booking.bookingType} Booking
          </div>
        </div>
        <span className={`booking-status ${statusClass[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <div className="booking-card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="booking-type-icon">
            <Icon size={22} />
          </div>
          <div className="booking-summary">
            <h4>{booking.summary}</h4>
            <div className="booking-date">
              {new Date(booking.travelDate).toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
              Booked on {new Date(booking.bookedAt).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>
        <div>
          <div className="booking-total">₹{booking.priceBreakdown.total.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'right' }}>
            {booking.paymentMethod?.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="booking-card-footer">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/bookings/${booking.bookingId}`)}>
          <Eye size={14} /> View Details
        </button>
        {(booking.paymentStatus === 'PENDING' || booking.paymentStatus === 'FAILED') && booking.status !== 'CANCELLED' && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/payment/${booking.bookingId}`)}>
            <CreditCard size={14} /> {booking.paymentStatus === 'FAILED' ? 'Retry Payment' : 'Pay Now'}
          </button>
        )}
        {booking.status === 'CONFIRMED' && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/booking-confirmation/${booking.bookingId}`)}>
            <Download size={14} /> Receipt
          </button>
        )}
        {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && onCancel && (
          <button className="btn btn-danger btn-sm" onClick={() => onCancel(booking.bookingId)}>
            <XCircle size={14} /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
