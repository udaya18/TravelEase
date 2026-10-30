import { useNavigate } from 'react-router-dom';
import { Users, Wind, Star, MapPin, Clock, Navigation } from 'lucide-react';
import type { Cab } from '../types/cab';
import { useTravelStore } from '../store/travelStore';

interface CabCardProps {
  cab: Cab;
}

const cabTypeClass: Record<string, string> = {
  Mini: 'cab-type-mini',
  Hatchback: 'cab-type-mini',
  Sedan: 'cab-type-sedan',
  SUV: 'cab-type-suv',
  Premium: 'cab-type-premium',
};

export default function CabCard({ cab }: CabCardProps) {
  const navigate = useNavigate();
  const selectCab = useTravelStore((s) => s.selectCab);

  const handleSelect = () => {
    selectCab(cab);
    navigate('/checkout');
  };

  return (
    <div className="cab-card" role="article" aria-label={`${cab.vehicleName} ${cab.cabType}`}>
      <img
        className="cab-card-img"
        src={cab.image}
        alt={cab.vehicleName}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400';
        }}
      />
      <div className="cab-card-body">
        <span className={`cab-type-badge ${cabTypeClass[cab.cabType] || 'cab-type-sedan'}`}>
          {cab.cabType}
        </span>
        <h4 className="cab-name">{cab.vehicleName}</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.625rem' }}>{cab.operator}</p>

        <div className="cab-info-row">
          <span className="cab-info-item"><Users size={13} /> {cab.seats} seats</span>
          <span className="cab-info-item">
            <Wind size={13} /> {cab.isAC ? 'AC' : 'Non-AC'}
          </span>
          <span className="cab-info-item">
            <Star size={13} style={{ color: 'var(--accent)' }} /> {cab.driverRating}
          </span>
        </div>

        <div className="cab-info-row">
          <span className="cab-info-item"><Navigation size={13} /> {cab.distance}</span>
          <span className="cab-info-item"><Clock size={13} /> {cab.estimatedDuration}</span>
        </div>

        <div style={{ margin: '0.5rem 0', padding: '0.5rem 0', borderTop: '1px dashed var(--gray-200)', borderBottom: '1px dashed var(--gray-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>
            <MapPin size={12} /> {cab.pickup}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            <MapPin size={12} color="var(--error)" /> {cab.drop}
          </div>
        </div>

        <div className="cab-fare-row">
          <div>
            <div className="cab-price">₹{cab.totalFare.toLocaleString('en-IN')}</div>
            <div className="cab-price-note">All inclusive</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSelect}>
            Select Cab
          </button>
        </div>
      </div>
    </div>
  );
}
