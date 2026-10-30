import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Printer, XCircle, Plane,
  Hotel as HotelIcon, Car, Calendar, MapPin, User, Mail, Phone,
  CreditCard, ShieldCheck, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { bookingApi } from '../api/bookingApi';
import type { Booking } from '../types/booking';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, cancelBooking } = useTravelStore();

  const [booking, setBooking] = useState<Booking | null>(() => {
    return bookings.find(b => b.bookingId === id || b.bookingReference === id) || null;
  });
  const [loading, setLoading] = useState(!booking);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchBooking = async () => {
      try {
        const found = await bookingApi.getBookingById(id);
        if (isMounted && found) {
          setBooking(found);
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBooking();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--gray-600)' }}>Retrieving booking details from server...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem' }}>
        <div className="container">
          <EmptyState
            title="Booking Record Not Found"
            description="We could not find any active booking record for this reference."
            action={<button className="btn btn-primary" onClick={() => navigate('/bookings')}>Back to Bookings</button>}
          />
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textData = `
========================================
TRAVELEASE OFFICIAL RESERVATION
Booking ID: ${booking.bookingId}
Booking Reference: ${booking.bookingReference || booking.bookingId}
Status: ${booking.status}
Payment Status: ${booking.paymentStatus}
Travel Date: ${booking.travelDate}
Summary: ${booking.summary}
Total Amount: Rs. ${booking.priceBreakdown.total}
========================================
`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${booking.bookingId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const result = await bookingApi.cancelBooking(booking.bookingId);
      if (result.success) {
        cancelBooking(booking.bookingId);
        setBooking(prev => prev ? {
          ...prev,
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
        } : null);
        setShowCancelModal(false);
      } else {
        setCancelError(result.message || 'Failed to cancel booking');
      }
    } catch (err: any) {
      setCancelError(err.response?.data?.message || err.message || 'Error occurred while cancelling');
    } finally {
      setCancelLoading(false);
    }
  };

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div className="page-header" style={{ padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="breadcrumb" style={{ margin: 0 }}>
            <button
              onClick={() => navigate('/bookings')}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={16} /> All Bookings
            </button>
            <span className="breadcrumb-sep">/</span>
            <span style={{ fontWeight: 600 }}>{booking.bookingId}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(booking.paymentStatus === 'PENDING' || booking.paymentStatus === 'FAILED') && !isCancelled && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/payment/${booking.bookingId}`)}>
                <CreditCard size={15} /> {booking.paymentStatus === 'FAILED' ? 'Retry Payment (Demo)' : 'Pay Now (Demo)'}
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Print
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
              <Download size={15} /> Download Receipt
            </button>
            {!isCancelled && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowCancelModal(true)}>
                <XCircle size={15} /> Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 880, paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Status Card */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            borderLeft: `5px solid ${isCancelled ? 'var(--error)' : 'var(--success)'}`,
            background: isCancelled ? '#fff5f5' : '#f0fdf4',
          }}
        >
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isCancelled ? (
                <AlertTriangle size={28} color="var(--error)" />
              ) : (
                <CheckCircle2 size={28} color="var(--success)" />
              )}
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: isCancelled ? 'var(--error)' : 'var(--success)' }}>
                  Reservation {booking.status}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', margin: '0.125rem 0 0 0' }}>
                  {isCancelled
                    ? 'This booking was cancelled. Any refund has been initiated to your source payment method.'
                    : 'Your reservation is confirmed and active with the service provider.'}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Booking Reference</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{booking.bookingReference || booking.bookingId}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                Payment: <span className={`badge ${booking.paymentStatus === 'DEMO_PAID' ? 'badge-warning' : booking.paymentStatus === 'PAID' ? 'badge-success' : booking.paymentStatus === 'REFUNDED' ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.75rem' }}>
                  {booking.paymentStatus === 'DEMO_PAID' ? 'Demo Verified' : booking.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {cancelError && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', color: '#dc2626' }}>
            <AlertTriangle size={18} />
            <span>{cancelError}</span>
          </div>
        )}

        {/* Detailed Trip Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Trip Itinerary Details
            </h3>

            {/* Flight specifics */}
            {(booking.bookingType === 'flight' || !!booking.flightDetails) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Plane size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                      {booking.flightDetails?.airline || 'Air India'} ({booking.flightDetails?.flightNumber || 'AI 101'})
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Cabin: {booking.flightDetails?.cabinClass || 'Economy'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', background: 'var(--gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Departure</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{booking.flightDetails?.departureTime || '06:00'}</div>
                    <div style={{ fontWeight: 600 }}>{booking.flightDetails?.fromCity || 'Hyderabad'} ({booking.flightDetails?.from || 'HYD'})</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Arrival</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{booking.flightDetails?.arrivalTime || '08:10'}</div>
                    <div style={{ fontWeight: 600 }}>{booking.flightDetails?.toCity || 'Delhi'} ({booking.flightDetails?.to || 'DEL'})</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{booking.travelDate}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Seats: {booking.travellers.length} Confirmed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Hotel specifics */}
            {(booking.bookingType === 'hotel' || !!booking.hotelDetails) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: (booking.flightDetails ? '1.5rem' : 0) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <HotelIcon size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                      {booking.hotelDetails?.hotelName || 'The Grand Hotel'}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {booking.hotelDetails?.location || booking.destination}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', background: 'var(--gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Room Type</div>
                    <div style={{ fontWeight: 700 }}>{booking.hotelDetails?.roomType || 'Deluxe Room'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Check-In</div>
                    <div style={{ fontWeight: 700 }}>{booking.hotelDetails?.checkIn || booking.travelDate} (14:00)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Check-Out</div>
                    <div style={{ fontWeight: 700 }}>{booking.hotelDetails?.checkOut || '2026-10-18'} (12:00)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Cab specifics */}
            {(booking.bookingType === 'cab' || !!booking.cabDetails) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Car size={24} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                      {booking.cabDetails?.vehicleName || 'Sedan'} ({booking.cabDetails?.cabType || 'Sedan'})
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Sanitised Air Conditioned Cab</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', background: 'var(--gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Pickup Location</div>
                    <div style={{ fontWeight: 700 }}>{booking.cabDetails?.pickup || 'Airport'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Drop Destination</div>
                    <div style={{ fontWeight: 700 }}>{booking.cabDetails?.drop || booking.destination}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Pickup Time</div>
                    <div style={{ fontWeight: 700 }}>{booking.cabDetails?.pickupDate || booking.travelDate} at {booking.cabDetails?.pickupTime || '10:00 AM'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Travellers & Contacts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} style={{ color: 'var(--primary)' }} /> Travellers
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {booking.travellers.map((traveller, i) => (
                  <div key={i} style={{ fontSize: '0.875rem' }}>
                    <strong>{traveller.firstName} {traveller.lastName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {traveller.gender} · Born {traveller.dateOfBirth}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--primary)' }} /> Contact Details
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
                <div>Email: {booking.contactDetails.email}</div>
                <div>Phone: {booking.contactDetails.countryCode} {booking.contactDetails.phone}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Receipt */}
        <div className="card">
          <div className="card-body">
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Invoice & Price Breakdown
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>Base Fare</span>
                <span>₹{booking.priceBreakdown.baseFare.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>Taxes & Fees</span>
                <span>₹{booking.priceBreakdown.taxes.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-600)' }}>Convenience Fee</span>
                <span>₹{booking.priceBreakdown.convenienceFee}</span>
              </div>
              {booking.priceBreakdown.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Discount</span>
                  <span>− ₹{booking.priceBreakdown.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary)' }}>₹{booking.priceBreakdown.total.toLocaleString('en-IN')}</span>
              </div>

              {booking.transactionReference && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--gray-200)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--gray-500)' }}>Demo Transaction ID:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                    {booking.transactionReference} <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>SIMULATED</span>
                  </span>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={14} />
                <span><strong>DEMO PAYMENT</strong> – Simulated transaction, no real money was charged.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showCancelModal}
        title="Confirm Booking Cancellation"
        message={`Are you sure you want to cancel booking ${booking.bookingId}? This cannot be undone.`}
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Reservation"
        danger={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
