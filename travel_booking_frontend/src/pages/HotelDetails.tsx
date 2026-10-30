import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Wifi, Coffee, Dumbbell, Waves, CheckCircle, XCircle,
  Calendar, Users, ShieldCheck, ArrowLeft, Heart, Share2, Sparkles, Clock
} from 'lucide-react';
import { useHotelById } from '../hooks/useHotels';
import { useTravelStore } from '../store/travelStore';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { RoomType } from '../types/hotel';

export default function HotelDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: hotel, isLoading, isError } = useHotelById(id || '');

  const {
    hotelSearchParams,
    selectHotel,
    selectRoom,
    setPriceBreakdown
  } = useTravelStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const checkIn = String(hotelSearchParams?.checkIn || today);
  const checkOut = String(hotelSearchParams?.checkOut || tomorrow);
  const guests = Number(hotelSearchParams?.guests || 2);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  // Set default selected room when hotel loads
  const currentRoom: RoomType | undefined = useMemo(() => {
    if (!hotel || !hotel.roomTypes.length) return undefined;
    return hotel.roomTypes.find(r => r.roomId === selectedRoomId) || hotel.roomTypes[0];
  }, [hotel, selectedRoomId]);

  if (isLoading) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading property details..." />
      </div>
    );
  }

  if (isError || !hotel) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem' }}>
        <div className="container">
          <EmptyState
            title="Hotel Not Found"
            description="The hotel property you are looking for does not exist or has been removed."
            action={<button className="btn btn-primary" onClick={() => navigate('/hotels')}>Back to Hotels</button>}
          />
        </div>
      </div>
    );
  }

  const roomPrice = currentRoom?.pricePerNight || hotel.pricePerNight;
  const baseTotal = roomPrice * nights;
  const taxes = Math.round(baseTotal * 0.12);
  const convenienceFee = 199;
  const finalTotal = baseTotal + taxes + convenienceFee;

  const handleProceedToBooking = (room?: RoomType) => {
    const chosenRoom = room || currentRoom || hotel.roomTypes[0];
    selectHotel(hotel);
    selectRoom(chosenRoom);

    setPriceBreakdown({
      baseFare: chosenRoom.pricePerNight * nights,
      taxes: Math.round(chosenRoom.pricePerNight * nights * 0.12),
      convenienceFee: 199,
      discount: 0,
      total: (chosenRoom.pricePerNight * nights) + Math.round(chosenRoom.pricePerNight * nights * 0.12) + 199,
    });

    navigate('/checkout?type=hotel');
  };

  return (
    <div className="page-wrapper">
      {/* Top Breadcrumb Bar */}
      <div className="page-header" style={{ padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="breadcrumb" style={{ margin: 0 }}>
            <button
              onClick={() => navigate('/hotels')}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={16} /> All Hotels
            </button>
            <span className="breadcrumb-sep">/</span>
            <span>{hotel.city}</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ fontWeight: 600 }}>{hotel.hotelName}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" title="Save to wishlist" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Heart size={16} /> Wishlist
            </button>
            <button className="btn btn-ghost btn-sm" title="Share" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        {/* Header Title Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
              <span className="badge badge-primary">{hotel.propertyType}</span>
              <div className="star-rating" aria-label={`${hotel.starRating} star hotel`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < hotel.starRating ? 'star-filled' : 'star-empty'} style={{ color: '#f59e0b' }}>★</span>
                ))}
              </div>
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '0.5rem' }}>{hotel.hotelName}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--gray-600)' }}>
              <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} /> {hotel.address}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--gray-50)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)' }}>Very Good</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{hotel.reviewCount.toLocaleString()} verified reviews</div>
            </div>
            <div style={{ background: 'var(--primary)', color: '#fff', fontSize: '1.25rem', fontWeight: 800, padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)' }}>
              {hotel.guestRating}
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative', height: '420px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <img
              src={hotel.images[activeImageIndex] || hotel.images[0]}
              alt={hotel.hotelName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }}
            />
            {hotel.highlights.length > 0 && (
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {hotel.highlights.map(h => (
                  <span key={h} className="badge badge-primary" style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#fff', border: 'none' }}>
                    <Sparkles size={12} style={{ display: 'inline', marginRight: '0.25rem' }} /> {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '1rem', height: '420px' }}>
            {hotel.images.slice(1, 3).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImageIndex(idx + 1)}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeImageIndex === idx + 1 ? '3px solid var(--primary)' : '1px solid var(--gray-200)',
                }}
              >
                <img
                  src={img}
                  alt={`${hotel.hotelName} preview ${idx + 2}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content Layout: Main Info + Sticky Booking Widget */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Main Info */}
          <div>
            {/* Description & Overview */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>About This Property</h3>
                <p style={{ lineHeight: 1.7, color: 'var(--gray-700)', marginBottom: '1.25rem' }}>{hotel.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Clock size={18} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Check-in Time</div>
                      <div style={{ fontWeight: 600 }}>{hotel.checkInTime}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Clock size={18} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Check-out Time</div>
                      <div style={{ fontWeight: 600 }}>{hotel.checkOutTime}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Cancellation</div>
                      <div style={{ fontWeight: 600, color: hotel.freeCancellation ? 'var(--success)' : 'var(--gray-800)' }}>
                        {hotel.freeCancellation ? 'Free Cancellation' : 'Cancellation Charges Apply'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>Popular Amenities</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.875rem' }}>
                  {hotel.amenities.map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Options Selection */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>Choose Your Room</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hotel.roomTypes.map(room => {
                    const isSelected = (currentRoom?.roomId === room.roomId);
                    return (
                      <div
                        key={room.roomId}
                        style={{
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          background: isSelected ? 'var(--primary-50)' : '#fff',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{room.roomName}</h4>
                              {isSelected && <span className="badge badge-primary">Selected</span>}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                              {room.bedType} · {room.size} · Up to {room.maxGuests} Guests
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                              ₹{room.pricePerNight.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>per night (excl. taxes)</div>
                          </div>
                        </div>

                        {/* Room Amenities */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          {room.amenities.map(am => (
                            <span key={am} className="tag" style={{ background: '#fff', border: '1px solid var(--gray-200)', fontSize: '0.75rem' }}>
                              {am}
                            </span>
                          ))}
                          {room.breakfastIncluded && (
                            <span className="tag tag-green" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle size={10} /> Free Breakfast
                            </span>
                          )}
                          {room.freeCancellation && (
                            <span className="tag tag-green" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle size={10} /> Free Cancellation
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-secondary' : 'btn-outline'}`}
                            onClick={() => setSelectedRoomId(room.roomId)}
                          >
                            {isSelected ? 'Current Choice' : 'Select This Room'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleProceedToBooking(room)}
                          >
                            Book Room Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 700 }}>Property Policies</h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--gray-700)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                  <li>{hotel.cancellationPolicy}</li>
                  <li>Government-issued photo ID is required upon check-in for all adult guests.</li>
                  <li>Early check-in and late check-out are subject to availability.</li>
                  <li>Pets are not allowed unless specified in advance.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sticky Booking Summary Widget */}
          <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
            <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.875rem' }}>
                  <div>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{roomPrice.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}> / night</span>
                  </div>
                  <div className="guest-rating" style={{ fontSize: '0.875rem' }}>
                    <Star size={13} fill="currentColor" /> {hotel.guestRating} ({hotel.reviewCount})
                  </div>
                </div>

                <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Check-In</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{checkIn}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Check-Out</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{checkOut}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Guests & Duration</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {guests} Guests · {nights} Night{nights > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>₹{roomPrice.toLocaleString('en-IN')} × {nights} nights</span>
                    <span>₹{baseTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Taxes & Service Fees (12%)</span>
                    <span>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Booking Fee</span>
                    <span>₹{convenienceFee}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.125rem' }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--primary)' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 48, fontSize: '1rem', fontWeight: 700 }}
                  onClick={() => handleProceedToBooking()}
                >
                  Reserve & Proceed
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.75rem' }}>
                  Instant confirmation · No hidden booking charges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
