import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Wifi, Coffee, Dumbbell, Waves, CheckCircle, XCircle } from 'lucide-react';
import type { Hotel } from '../types/hotel';
import { useTravelStore } from '../store/travelStore';

interface HotelCardProps {
  hotel: Hotel;
  nights?: number;
}

const amenityIcons: Record<string, React.ReactNode> = {
  'Free WiFi': <Wifi size={11} />,
  'Swimming Pool': <Waves size={11} />,
  'Gym': <Dumbbell size={11} />,
  'Restaurant': <Coffee size={11} />,
};

function getAmenityIcon(amenity: string) {
  return amenityIcons[amenity] || null;
}

export default function HotelCard({ hotel, nights = 1 }: HotelCardProps) {
  const navigate = useNavigate();
  const selectHotel = useTravelStore((s) => s.selectHotel);

  const discount = hotel.originalPricePerNight
    ? Math.round(((hotel.originalPricePerNight - hotel.pricePerNight) / hotel.originalPricePerNight) * 100)
    : 0;

  const totalPrice = hotel.pricePerNight * nights;

  const handleView = () => {
    selectHotel(hotel);
    navigate(`/hotels/${hotel.hotelId}`);
  };

  const handleBook = () => {
    selectHotel(hotel);
    navigate(`/hotels/${hotel.hotelId}`);
  };

  return (
    <div className="hotel-card" role="article" aria-label={hotel.hotelName}>
      {/* Image */}
      <div className="hotel-card-img">
        <img
          src={hotel.images[0]}
          alt={hotel.hotelName}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
          }}
        />
        <div className="hotel-card-img-overlay">
          {discount > 0 && (
            <span className="badge badge-success">{discount}% off</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="hotel-card-body">
        <div className="hotel-card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <h4 className="hotel-name">{hotel.hotelName}</h4>
            <div className="guest-rating" aria-label={`Rating: ${hotel.guestRating} out of 5`}>
              <Star size={12} fill="currentColor" />
              {hotel.guestRating}
            </div>
          </div>
          <div className="hotel-location">
            <MapPin size={12} />
            {hotel.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="star-rating" aria-label={`${hotel.starRating} star hotel`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < hotel.starRating ? 'star-filled' : 'star-empty'} aria-hidden="true">★</span>
              ))}
            </div>
            <span className="review-count">({hotel.reviewCount.toLocaleString()} reviews)</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="hotel-amenities">
          {hotel.amenities.slice(0, 5).map((amenity) => (
            <span key={amenity} className="amenity-tag">
              {getAmenityIcon(amenity)} {amenity}
            </span>
          ))}
          {hotel.amenities.length > 5 && (
            <span className="amenity-tag">+{hotel.amenities.length - 5} more</span>
          )}
        </div>

        {/* Policies */}
        <div className="hotel-policies" style={{ marginBottom: '0.5rem' }}>
          {hotel.breakfastIncluded && (
            <span className="tag tag-green"><CheckCircle size={11} /> Breakfast</span>
          )}
          {hotel.freeCancellation ? (
            <span className="tag tag-green"><CheckCircle size={11} /> Free Cancellation</span>
          ) : (
            <span className="tag tag-red"><XCircle size={11} /> Non-refundable</span>
          )}
        </div>

        {/* Footer */}
        <div className="hotel-card-footer">
          <div>
            <div className="text-xs text-gray">Room Type: {hotel.roomTypes[0]?.roomName || 'Standard Room'}</div>
          </div>
          <div className="hotel-price">
            {hotel.originalPricePerNight && (
              <div className="hotel-price-original">₹{hotel.originalPricePerNight.toLocaleString('en-IN')}</div>
            )}
            <div className="hotel-price-amount">₹{hotel.pricePerNight.toLocaleString('en-IN')}</div>
            <div className="hotel-price-per">per night</div>
            {nights > 1 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 600 }}>
                Total: ₹{totalPrice.toLocaleString('en-IN')} for {nights} nights
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem' }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={handleView}>View Hotel</button>
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleBook}>Book Now</button>
        </div>
      </div>
    </div>
  );
}
