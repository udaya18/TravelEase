import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, Download, Printer, ArrowRight, Plane,
  Hotel as HotelIcon, Car, Calendar, MapPin, User, ShieldCheck, Share2, Loader2
} from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { bookingApi } from '../api/bookingApi';
import type { Booking } from '../types/booking';
import EmptyState from '../components/EmptyState';

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings } = useTravelStore();

  const [booking, setBooking] = useState<Booking | null>(() => {
    return bookings.find(b => b.bookingId === id || b.bookingReference === id) || null;
  });
  const [loading, setLoading] = useState(!booking);

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
        console.error('Error fetching booking confirmation:', err);
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
        <p style={{ color: 'var(--gray-600)' }}>Retrieving your booking confirmation...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem' }}>
        <div className="container">
          <EmptyState
            title="Booking Not Found"
            description="We could not find the booking details for this confirmation reference."
            action={<button className="btn btn-primary" onClick={() => navigate('/bookings')}>Go to My Bookings</button>}
          />
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const ticketSummary = `
===================================================
TRAVELEASE OFFICIAL E-TICKET & CONFIRMATION
===================================================
SIMULATED TRANSACTION - DEMO PAYMENT ONLY
Transaction ID: ${booking.transactionReference || 'DEMO-TXN-' + booking.bookingId}
Booking Reference: ${booking.bookingReference || booking.bookingId}
Booking ID: ${booking.bookingId}
Booking Status: ${booking.status}
Payment Status: ${booking.paymentStatus}
Booked At: ${new Date(booking.bookedAt).toLocaleString()}

TRIP SUMMARY:
${booking.summary}
Destination: ${booking.destination}
Travel Date: ${booking.travelDate}

TRAVELLERS:
${booking.travellers.map((t, i) => `${i + 1}. ${t.firstName} ${t.lastName} (${t.gender}, ${t.type})`).join('\n')}

CONTACT:
Email: ${booking.contactDetails.email}
Phone: ${booking.contactDetails.countryCode} ${booking.contactDetails.phone}

FARE BREAKDOWN:
Base Fare: Rs. ${booking.priceBreakdown.baseFare.toLocaleString('en-IN')}
Taxes & Fees: Rs. ${booking.priceBreakdown.taxes.toLocaleString('en-IN')}
Convenience Fee: Rs. ${booking.priceBreakdown.convenienceFee}
Discount: Rs. ${booking.priceBreakdown.discount}
Total Paid: Rs. ${booking.priceBreakdown.total.toLocaleString('en-IN')}
Payment Method: ${booking.paymentMethod || 'UPI'}
===================================================
Thank you for choosing TravelEase!
24x7 Customer Helpline: 1800-123-TRAVEL
===================================================
`;
    const blob = new Blob([ticketSummary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `e-ticket-${booking.bookingId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-wrapper">
      {/* Success Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          padding: '3rem 1rem',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: 680 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Booking Confirmed!
          </h1>
          <p style={{ fontSize: '1rem', color: '#e6fffa', marginBottom: '1rem' }}>
            Your trip reservation has been successfully placed and payment is authorized.
          </p>
          <div
            style={{
              display: 'inline-block',
              background: '#fff',
              color: '#065f46',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: '1.125rem',
              letterSpacing: '0.5px',
            }}
          >
            Booking Reference: {booking.bookingReference || booking.bookingId}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              <ShieldCheck size={14} /> DEMO PAYMENT – No real money is charged.
            </span>
          </div>
        </div>
      </div>

      {/* Main E-Ticket Display */}
      <div className="container" style={{ maxWidth: 840, paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            E-ticket confirmation sent to <strong style={{ color: 'var(--gray-800)' }}>{booking.contactDetails.email}</strong>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Print E-Ticket
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

        {/* The E-Ticket Card */}
        <div
          className="card"
          style={{
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--gray-200)',
            marginBottom: '2rem',
          }}
        >
          {/* Ticket Header */}
          <div
            style={{
              background: 'var(--gray-900)',
              color: '#fff',
              padding: '1.5rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  Travel<span style={{ color: 'var(--primary-light)' }}>Ease</span>
                </span>
                <span className="badge badge-success" style={{ marginLeft: '0.5rem' }}>
                  {booking.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                Issued: {new Date(booking.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Booking ID</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                {booking.bookingId}
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: '2rem' }}>
            {/* Specific Service Details */}
            {(booking.bookingType === 'flight' || !!booking.flightDetails) && (
              <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--gray-300)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                  <Plane size={20} /> Flight Journey Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Airline & Flight</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {booking.flightDetails?.airline || 'Air India'} · {booking.flightDetails?.flightNumber || 'AI 101'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Class: {booking.flightDetails?.cabinClass || 'Economy'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>From</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {booking.flightDetails?.departureTime || '06:00'} · {booking.flightDetails?.from || 'HYD'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{booking.flightDetails?.fromCity || 'Hyderabad'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>To</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {booking.flightDetails?.arrivalTime || '08:10'} · {booking.flightDetails?.to || 'DEL'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{booking.flightDetails?.toCity || 'Delhi'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Travel Date</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{booking.travelDate}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Status: On Schedule</div>
                  </div>
                </div>
              </div>
            )}

            {(booking.bookingType === 'hotel' || !!booking.hotelDetails) && (
              <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--gray-300)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                  <HotelIcon size={20} /> Hotel Stay Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Property</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {booking.hotelDetails?.hotelName || 'The Grand Hotel'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{booking.hotelDetails?.location || booking.destination}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Room Type</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {booking.hotelDetails?.roomType || 'Deluxe Room'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Breakfast Included</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Check-in / Check-out</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {booking.hotelDetails?.checkIn || booking.travelDate} to {booking.hotelDetails?.checkOut || '2026-10-18'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Check-in: 14:00</div>
                  </div>
                </div>
              </div>
            )}

            {(booking.bookingType === 'cab' || !!booking.cabDetails) && (
              <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--gray-300)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                  <Car size={20} /> Cab Transfer Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Vehicle</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {booking.cabDetails?.vehicleName || 'Sedan'} ({booking.cabDetails?.cabType || 'Sedan'})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Sanitised AC Cab</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Pickup Location</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {booking.cabDetails?.pickup || 'Airport'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Time: {booking.cabDetails?.pickupTime || '10:00 AM'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Drop Destination</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {booking.cabDetails?.drop || booking.destination}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>Date: {booking.cabDetails?.pickupDate || booking.travelDate}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Travellers & Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--gray-300)' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                  Passengers / Guests ({booking.travellers.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {booking.travellers.map((traveller, i) => (
                    <div key={i} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600 }}>{traveller.firstName} {traveller.lastName}</span>
                      <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>({traveller.gender})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                  Contact Information
                </h4>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
                  <div>Email: {booking.contactDetails.email}</div>
                  <div>Phone: {booking.contactDetails.countryCode} {booking.contactDetails.phone}</div>
                </div>
              </div>
            </div>

            {/* Fare Breakdown Table */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                Payment Summary
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Base Price</span>
                  <span>₹{booking.priceBreakdown.baseFare.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Taxes & Regulatory Charges</span>
                  <span>₹{booking.priceBreakdown.taxes.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>Convenience Fee</span>
                  <span>₹{booking.priceBreakdown.convenienceFee}</span>
                </div>
                {booking.priceBreakdown.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Promotional Discount</span>
                    <span>− ₹{booking.priceBreakdown.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                  <span>Amount Paid ({booking.paymentMethod || 'Online'})</span>
                  <span style={{ color: 'var(--primary)' }}>₹{booking.priceBreakdown.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--gray-50)', padding: '1rem 2rem', borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            <span>Need assistance? 24/7 Helpline: 1800-123-TRAVEL</span>
            <span>support@travelease.com</span>
          </div>
        </div>

        {/* Post-booking action links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/bookings')}>
            View All My Bookings
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Book Another Trip <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
