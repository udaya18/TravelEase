import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  CreditCard, Smartphone, Building, ShieldCheck, Tag,
  User, Mail, Phone, Calendar, ArrowLeft, Check, AlertCircle, Loader2, Plane, Hotel as HotelIcon, Car
} from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import type { Booking, BookingType, PaymentMethod } from '../types/booking';
import type { Traveller } from '../types/traveller';
import { bookingApi } from '../api/bookingApi';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paramType = searchParams.get('type') as BookingType | null;

  const {
    user,
    isAuthenticated,
    selectedFlight,
    selectedHotel,
    selectedRoom,
    selectedCab,
    priceBreakdown,
    flightSearchParams,
    hotelSearchParams,
    cabSearchParams,
    createBooking,
  } = useTravelStore();

  const [checkoutError, setCheckoutError] = useState('');

  // Determine active booking type
  const bookingType: BookingType = paramType || (
    (selectedFlight && selectedHotel) ? 'package' :
    selectedFlight ? 'flight' : selectedHotel ? 'hotel' : selectedCab ? 'cab' : 'package'
  );

  // Travellers State
  const [travellers, setTravellers] = useState<Traveller[]>([
    {
      travellerId: 'T-1',
      firstName: user?.fullName ? user.fullName.split(' ')[0] : 'Traveler',
      lastName: user?.fullName ? user.fullName.split(' ').slice(1).join(' ') || '' : '',
      gender: 'Male',
      dateOfBirth: '1995-05-15',
      type: 'Adult',
    },
  ]);

  // Contact Info State
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '9876543210');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('834');
  const [cardHolder, setCardHolder] = useState(user?.fullName || 'CARD HOLDER');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Compute Base & Taxes based on selections if priceBreakdown isn't already set
  const initialBaseFare = useMemo(() => {
    if (priceBreakdown?.baseFare) return priceBreakdown.baseFare;
    if (bookingType === 'package' || bookingType === 'itinerary') {
      let sum = 0;
      if (selectedFlight) sum += selectedFlight.price * travellers.length;
      if (selectedHotel) sum += (selectedRoom?.pricePerNight || selectedHotel.pricePerNight);
      if (selectedCab) sum += selectedCab.totalFare;
      return sum > 0 ? sum : 12500;
    }
    if (bookingType === 'flight' && selectedFlight) return selectedFlight.price * travellers.length;
    if (bookingType === 'hotel' && selectedHotel) return (selectedRoom?.pricePerNight || selectedHotel.pricePerNight);
    if (bookingType === 'cab' && selectedCab) return selectedCab.totalFare;
    return 4850;
  }, [priceBreakdown, bookingType, selectedFlight, selectedHotel, selectedRoom, selectedCab, travellers.length]);

  const taxes = Math.round(initialBaseFare * 0.12);
  const convenienceFee = bookingType === 'cab' ? 49 : 149;
  const netTotal = Math.max(0, initialBaseFare + taxes + convenienceFee - promoDiscount);

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'WELCOME10') {
      const disc = Math.round(initialBaseFare * 0.1);
      setPromoDiscount(disc);
      setAppliedPromo('WELCOME10 (10% OFF)');
    } else if (code === 'FLAT500') {
      setPromoDiscount(500);
      setAppliedPromo('FLAT500 (₹500 OFF)');
    } else if (code === 'TRAVEL2026') {
      const disc = Math.round(initialBaseFare * 0.15);
      setPromoDiscount(disc);
      setAppliedPromo('TRAVEL2026 (15% OFF)');
    } else {
      setPromoError('Invalid promo code. Try WELCOME10, FLAT500, or TRAVEL2026');
    }
  };

  const handleAddTraveller = () => {
    const nextNum = travellers.length + 1;
    setTravellers([
      ...travellers,
      {
        travellerId: `T-${nextNum}`,
        firstName: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '1998-01-01',
        type: 'Adult',
      },
    ]);
  };

  const handleUpdateTraveller = (index: number, field: keyof Traveller, value: any) => {
    const updated = [...travellers];
    updated[index] = { ...updated[index], [field]: value };
    setTravellers(updated);
  };

  const handleRemoveTraveller = (index: number) => {
    if (travellers.length > 1) {
      setTravellers(travellers.filter((_, i) => i !== index));
    }
  };

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      alert('Please accept terms and conditions to proceed.');
      return;
    }

    setIsProcessing(true);
    setCheckoutError('');

    try {
      let summary = '';
      let destination = 'India';

      if (bookingType === 'package' || bookingType === 'itinerary') {
        const dest = selectedFlight?.toCity || selectedHotel?.city || selectedCab?.drop || 'India';
        destination = dest;
        const parts: string[] = [];
        if (selectedFlight) parts.push(`✈ ${selectedFlight.airline} (${selectedFlight.from} → ${selectedFlight.to})`);
        if (selectedHotel) parts.push(`🏨 ${selectedHotel.hotelName}`);
        if (selectedCab) parts.push(`🚖 ${selectedCab.vehicleName}`);
        summary = parts.join(' | ') || 'Complete Travel Itinerary Package';
      } else if (bookingType === 'flight') {
        destination = selectedFlight?.toCity || 'Delhi';
        summary = `${selectedFlight?.from || 'HYD'} → ${selectedFlight?.to || 'DEL'} | ${selectedFlight?.airline || 'Air India'}`;
      } else if (bookingType === 'hotel') {
        destination = selectedHotel?.city || 'Hyderabad';
        summary = `${selectedHotel?.hotelName || 'Grand Hotel'} · ${selectedRoom?.roomName || 'Deluxe Room'}`;
      } else {
        destination = selectedCab?.drop || 'Banjara Hills';
        summary = `${selectedCab?.vehicleName || 'Sedan'} · ${selectedCab?.pickup || 'Airport'} to ${selectedCab?.drop || 'City'}`;
      }

      const bookingDraft: Omit<Booking, 'bookingId' | 'bookedAt'> = {
        bookingType,
        status: 'PENDING' as any,
        paymentStatus: 'PENDING' as any,
        paymentMethod: (paymentMethod || 'CARD') as PaymentMethod,
        travellers,
        contactDetails: {
          email,
          phone,
          countryCode: '+91',
        },
        priceBreakdown: {
          baseFare: initialBaseFare,
          taxes,
          convenienceFee,
          discount: promoDiscount,
          total: netTotal,
        },
        travelDate: (flightSearchParams?.departureDate || hotelSearchParams?.checkIn || cabSearchParams?.date || '2026-10-15') as string,
        destination,
        summary,
        flightDetails: (bookingType === 'flight' || bookingType === 'package' || bookingType === 'itinerary') && selectedFlight ? {
          flightId: selectedFlight.flightId,
          airline: selectedFlight.airline,
          flightNumber: selectedFlight.flightNumber,
          from: selectedFlight.from,
          fromCity: selectedFlight.fromCity,
          to: selectedFlight.to,
          toCity: selectedFlight.toCity,
          departureTime: selectedFlight.departureTime,
          arrivalTime: selectedFlight.arrivalTime,
          cabinClass: selectedFlight.cabinClass,
          seats: travellers.length,
        } : undefined,
        hotelDetails: (bookingType === 'hotel' || bookingType === 'package' || bookingType === 'itinerary') && selectedHotel ? {
          hotelId: selectedHotel.hotelId,
          hotelName: selectedHotel.hotelName,
          location: selectedHotel.location,
          roomType: selectedRoom?.roomName || 'Deluxe Room',
          checkIn: String(hotelSearchParams?.checkIn || '2026-10-15'),
          checkOut: String(hotelSearchParams?.checkOut || '2026-10-18'),
          nights: 3,
          guests: travellers.length,
          rooms: 1,
        } : undefined,
        cabDetails: (bookingType === 'cab' || bookingType === 'package' || bookingType === 'itinerary') && selectedCab ? {
          cabId: selectedCab.cabId,
          vehicleName: selectedCab.vehicleName,
          cabType: selectedCab.cabType,
          pickup: selectedCab.pickup,
          drop: selectedCab.drop,
          pickupDate: String(cabSearchParams?.date || '2026-10-15'),
          pickupTime: String(cabSearchParams?.time || '10:00 AM'),
        } : undefined,
      };

      const newBooking = await bookingApi.createBooking(bookingDraft, user?.userId);
      createBooking(newBooking);
      setIsProcessing(false);
      navigate(`/payment/${newBooking.bookingId}`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      const status = err.response?.status;
      const rawMsg = err.response?.data?.message || err.message || '';

      if (status === 401) {
        setCheckoutError('Your session has expired or you are not signed in. Please sign in to proceed with your booking.');
      } else if (status === 409) {
        setCheckoutError(rawMsg ? `Booking Conflict: ${rawMsg}` : 'Booking Conflict: The selected flight seat, hotel room, or cab is no longer available or already booked.');
      } else {
        setCheckoutError(rawMsg || 'Failed to process booking. Please check availability and try again.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasToken = !!localStorage.getItem('travelease_token') || !!useTravelStore.getState().token;
  if (!isAuthenticated || !user || !hasToken) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <User size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In Required</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Please sign in to proceed with secure checkout, inventory reservation, and booking confirmation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/login', { state: { from: location } })}
              >
                Sign In to Proceed
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/signup')}
              >
                Create an Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header" style={{ padding: '1.25rem 0' }}>
        <div className="container">
          <div className="breadcrumb" style={{ margin: 0 }}>
            <a onClick={() => navigate(-1)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={16} /> Back
            </a>
            <span className="breadcrumb-sep">/</span>
            <span>Review & Checkout</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>Secure Checkout & Payment</h1>
          <p>Complete your booking details and make a seamless, encrypted payment</p>
          {checkoutError && (
            <div style={{ padding: '1rem 1.25rem', background: '#fef2f2', color: '#991b1b', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginTop: '1rem', border: '1px solid #f87171' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <AlertCircle size={18} style={{ color: '#dc2626' }} />
                <span>
                  {checkoutError.includes('session') || checkoutError.includes('sign in')
                    ? 'Authentication Required'
                    : checkoutError.includes('Conflict') || checkoutError.includes('already') || checkoutError.includes('unavailable')
                    ? 'Booking Conflict'
                    : 'Booking Error'}
                </span>
              </div>
              <p style={{ margin: '0 0 0.75rem 1.6rem', fontSize: '0.875rem' }}>{checkoutError}</p>
              <div style={{ marginLeft: '1.6rem', display: 'flex', gap: '0.75rem' }}>
                {(checkoutError.includes('session') || checkoutError.includes('sign in')) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/login', { state: { from: location } })}
                  >
                    Sign In Again
                  </button>
                )}
                {(checkoutError.includes('Conflict') || checkoutError.includes('unavailable') || checkoutError.includes('already booked') || checkoutError.includes('seats') || checkoutError.includes('rooms')) && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ background: 'white' }}
                    onClick={() => navigate(bookingType === 'cab' ? '/cabs' : bookingType === 'hotel' ? '/hotels' : '/flights')}
                  >
                    Choose Different Option
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <form onSubmit={handlePayAndConfirm}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
            {/* Left Column: Forms */}
            <div>
              {/* Trip Summary Card */}
              <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div className="card-body">
                  {(bookingType === 'package' || bookingType === 'itinerary') ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span className="badge badge-primary">Combined Package Booking</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600 }}>All-in-One Reservation</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {selectedFlight && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Plane size={16} style={{ color: 'var(--primary)' }} />
                            <strong>Flight:</strong> {selectedFlight.airline} ({selectedFlight.from} → {selectedFlight.to}) · {selectedFlight.departureTime}
                          </div>
                        )}
                        {selectedHotel && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <HotelIcon size={16} style={{ color: 'var(--primary)' }} />
                            <strong>Hotel:</strong> {selectedHotel.hotelName} ({selectedRoom?.roomName || 'Deluxe Room'}) · {selectedHotel.location}
                          </div>
                        )}
                        {selectedCab && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <Car size={16} style={{ color: 'var(--primary)' }} />
                            <strong>Cab:</strong> {selectedCab.vehicleName} ({selectedCab.cabType}) · {selectedCab.pickup} to {selectedCab.drop}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {bookingType === 'flight' && <Plane size={20} style={{ color: 'var(--primary)' }} />}
                        {bookingType === 'hotel' && <HotelIcon size={20} style={{ color: 'var(--primary)' }} />}
                        {bookingType === 'cab' && <Car size={20} style={{ color: 'var(--primary)' }} />}
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                          {bookingType === 'flight' && (selectedFlight ? `${selectedFlight.airline} (${selectedFlight.flightNumber}) : ${selectedFlight.from} → ${selectedFlight.to}` : 'Flight Booking')}
                          {bookingType === 'hotel' && (selectedHotel ? `${selectedHotel.hotelName} (${selectedRoom?.roomName || 'Deluxe Room'})` : 'Hotel Reservation')}
                          {bookingType === 'cab' && (selectedCab ? `${selectedCab.vehicleName} (${selectedCab.cabType})` : 'Airport Cab Transfer')}
                        </h3>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
                        {bookingType === 'flight' && selectedFlight && `Departure: ${selectedFlight.departureTime} · Duration: ${selectedFlight.duration} · ${selectedFlight.cabinClass}`}
                        {bookingType === 'hotel' && selectedHotel && `Location: ${selectedHotel.location} · Check-in: 14:00`}
                        {bookingType === 'cab' && selectedCab && `Route: ${selectedCab.pickup} to ${selectedCab.drop} · Approx ${selectedCab.estimatedDuration}`}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Step 1: Traveller Details */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={18} style={{ color: 'var(--primary)' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Traveller Information</h3>
                    </div>
                    {bookingType === 'flight' && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddTraveller}>
                        + Add Traveller
                      </button>
                    )}
                  </div>

                  {travellers.map((traveller, idx) => (
                    <div
                      key={traveller.travellerId}
                      style={{
                        padding: '1rem',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: idx < travellers.length - 1 ? '1rem' : 0,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          Traveller {idx + 1} ({traveller.type})
                        </span>
                        {travellers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--error)', fontSize: '0.8rem' }}
                            onClick={() => handleRemoveTraveller(idx)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input
                            className="form-control"
                            required
                            placeholder="e.g. Udayasri"
                            value={traveller.firstName}
                            onChange={e => handleUpdateTraveller(idx, 'firstName', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input
                            className="form-control"
                            required
                            placeholder="e.g. Sharma"
                            value={traveller.lastName}
                            onChange={e => handleUpdateTraveller(idx, 'lastName', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Gender</label>
                          <select
                            className="form-control"
                            value={traveller.gender}
                            onChange={e => handleUpdateTraveller(idx, 'gender', e.target.value)}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Date of Birth</label>
                          <input
                            type="date"
                            className="form-control"
                            required
                            value={traveller.dateOfBirth}
                            onChange={e => handleUpdateTraveller(idx, 'dateOfBirth', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Contact Details */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                    <Mail size={18} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Contact Details</h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                    Your e-ticket, invoice, and travel alerts will be sent to these contact details.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number (10 Digits)</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.875rem' }}>
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          className="form-control"
                          required
                          placeholder="9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Options */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                    <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Select Payment Method</h3>
                  </div>

                  {/* Payment Tabs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <button
                      type="button"
                      className={`btn ${paymentMethod === 'DEMO' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPaymentMethod('DEMO')}
                      style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.25rem' }}
                    >
                      <ShieldCheck size={15} /> Demo (Instant)
                    </button>
                    <button
                      type="button"
                      className={`btn ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPaymentMethod('UPI')}
                      style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.25rem' }}
                    >
                      <Smartphone size={15} /> UPI
                    </button>
                    <button
                      type="button"
                      className={`btn ${paymentMethod === 'CREDIT_CARD' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.25rem' }}
                    >
                      <CreditCard size={15} /> Card
                    </button>
                    <button
                      type="button"
                      className={`btn ${paymentMethod === 'NET_BANKING' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setPaymentMethod('NET_BANKING')}
                      style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem 0.25rem' }}
                    >
                      <Building size={15} /> NetBanking
                    </button>
                  </div>

                  {/* Demo Payment Explanation */}
                  {paymentMethod === 'DEMO' && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '1.25rem', borderRadius: 'var(--radius-lg)', color: '#166534', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={18} /> Verified Demo / Sandbox Payment Mode
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                        This is an official demonstration booking mode. Your booking will be instantly reserved, assigned an authentic booking reference, and inventory will be updated without charging a live payment card.
                      </div>
                    </div>
                  )}

                  {/* UPI Form */}
                  {paymentMethod === 'UPI' && (
                    <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label">Virtual Payment Address (UPI ID)</label>
                        <input
                          className="form-control"
                          placeholder="e.g. mobileNumber@upi / yourname@okaxis"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['@okhdfcbank', '@okicici', '@paytm', '@ybl'].map(ext => (
                          <button
                            key={ext}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => setUpiId(`udayasri${ext}`)}
                          >
                            udayasri{ext}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Form */}
                  {paymentMethod === 'CREDIT_CARD' && (
                    <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label">Card Number</label>
                        <input
                          className="form-control"
                          placeholder="16-digit card number"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Cardholder Name</label>
                          <input
                            className="form-control"
                            value={cardHolder}
                            onChange={e => setCardHolder(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Expiry (MM/YY)</label>
                          <input
                            className="form-control"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ maxWidth: 120 }}>
                        <label className="form-label">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          className="form-control"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Net Banking */}
                  {paymentMethod === 'NET_BANKING' && (
                    <div style={{ background: 'var(--gray-50)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                      <label className="form-label">Select Your Bank</label>
                      <select
                        className="form-control"
                        value={selectedBank}
                        onChange={e => setSelectedBank(e.target.value)}
                      >
                        <option>HDFC Bank</option>
                        <option>State Bank of India (SBI)</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: '0.25rem' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  I confirm that I have reviewed the booking details and passenger names, and I accept the booking policy, fare rules, and cancellation terms.
                </span>
              </label>
            </div>

            {/* Right Column: Fare Summary & Promo Code */}
            <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
              <div className="card" style={{ boxShadow: 'var(--shadow-lg)', marginBottom: '1.25rem' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                    Payment Breakdown
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Base Fare</span>
                      <span>₹{initialBaseFare.toLocaleString('en-IN')}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Taxes & Aviation/GST Charges</span>
                      <span>₹{taxes.toLocaleString('en-IN')}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Convenience Fee</span>
                      <span>₹{convenienceFee}</span>
                    </div>

                    {promoDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600 }}>
                        <span>Promo Code Discount ({appliedPromo})</span>
                        <span>− ₹{promoDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                      <span>Total Payable</span>
                      <span style={{ color: 'var(--primary)' }}>₹{netTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Promo Code Input */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className="form-control"
                        placeholder="e.g. WELCOME10"
                        style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleApplyPromo}
                      >
                        <Tag size={14} /> Apply
                      </button>
                    </div>
                    {promoError && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.375rem' }}>
                        {promoError}
                      </div>
                    )}
                    {appliedPromo && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.375rem', fontWeight: 600 }}>
                        ✓ {appliedPromo} applied successfully!
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 0.85rem', background: '#ecfdf5', borderRadius: 'var(--radius)', border: '1px solid #a7f3d0', marginBottom: '1rem', fontSize: '0.75rem', color: '#065f46' }}>
                    <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Risk-Aware Trip Protection:</strong> Itinerary monitored for flight delay and connection risks with rule-based travel alerts.</span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isProcessing}
                    style={{ width: '100%', height: 48, fontSize: '1rem', fontWeight: 700 }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Connecting to Demo Gateway...
                      </>
                    ) : (
                      `Proceed to Demo Payment (₹${netTotal.toLocaleString('en-IN')})`
                    )}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.75rem', color: '#166534', background: '#f0fdf4', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                    DEMO PAYMENT – No real money is charged.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
