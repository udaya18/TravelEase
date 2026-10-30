import { useNavigate } from 'react-router-dom';
import { ArrowRight, Luggage, RefreshCw, Star, Clock, Zap, ShieldCheck } from 'lucide-react';
import type { Flight } from '../types/flight';
import type { RiskScoreDetails } from '../api/riskApi';
import RiskBadge from './RiskBadge';
import { useTravelStore } from '../store/travelStore';

interface FlightCardProps {
  flight: Flight;
  riskDetails?: RiskScoreDetails;
  onSelect?: (flight: Flight) => void;
  onViewRisk?: (flight: Flight, details: RiskScoreDetails) => void;
}

function formatPrice(p: number) {
  return `₹${p.toLocaleString('en-IN')}`;
}

export default function FlightCard({ flight, riskDetails, onSelect, onViewRisk }: FlightCardProps) {
  const navigate = useNavigate();
  const selectFlight = useTravelStore((s) => s.selectFlight);

  const handleViewDetails = () => {
    selectFlight(flight);
    navigate(`/flights/${flight.flightId}`);
  };

  const handleSelect = () => {
    selectFlight(flight);
    if (onSelect) onSelect(flight);
    else navigate(`/flights/${flight.flightId}`);
  };

  const discount = flight.originalPrice
    ? Math.round(((flight.originalPrice - flight.price) / flight.originalPrice) * 100)
    : 0;

  return (
    <div className="flight-card" role="article" aria-label={`${flight.airline} flight from ${flight.fromCity} to ${flight.toCity}`}>
      <div className="flight-card-top">
        {/* Airline */}
        <div className="flight-airline">
          <div className="airline-logo-placeholder" aria-hidden="true">
            {flight.airlineCode}
          </div>
          <div className="airline-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h5 style={{ margin: 0 }}>{flight.airline}</h5>
              {riskDetails && (
                <RiskBadge
                  level={riskDetails.riskLevel}
                  score={riskDetails.riskScore}
                  onClick={onViewRisk ? () => onViewRisk(flight, riskDetails) : undefined}
                />
              )}
            </div>
            <span>{flight.flightNumber}</span>
          </div>
        </div>

        {/* Route */}
        <div className="flight-route" style={{ flex: 1 }}>
          <div className="flight-time">
            <h4>{flight.departureTime}</h4>
            <span>{flight.from}</span>
          </div>
          <div className="flight-path">
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: '0.25rem' }}>
              {flight.duration}
            </div>
            <div className="flight-path-line">
              <ArrowRight size={14} className="flight-path-arrow" />
            </div>
            <div style={{ fontSize: '0.7rem', color: flight.stops === 0 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}
            </div>
          </div>
          <div className="flight-time">
            <h4>{flight.arrivalTime}</h4>
            <span>{flight.to}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flight-price-col">
          {discount > 0 && (
            <div className="flight-price-original">{formatPrice(flight.originalPrice!)}</div>
          )}
          <div className="flight-price">{formatPrice(flight.price)}</div>
          {discount > 0 && (
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{discount}% off</span>
          )}
          <div className="flight-price-per">per traveller</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
            {flight.seatAvailability} seats left
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flight-card-footer">
        <div className="flight-tags">
          <span className="flight-tag"><Luggage size={12} /> {flight.baggage}</span>
          <span className="flight-tag-dot" />
          {flight.refundable ? (
            <span className="flight-tag" style={{ color: 'var(--success)' }}>
              <RefreshCw size={11} /> Refundable
            </span>
          ) : (
            <span className="flight-tag" style={{ color: 'var(--error)' }}>Non-refundable</span>
          )}
          <span className="flight-tag-dot" />
          {flight.rating && (
            <span className="flight-tag"><Star size={11} style={{ color: 'var(--accent)' }} /> {flight.rating}</span>
          )}
          <span className="flight-tag-dot" />
          <span className="flight-tag"><Clock size={11} /> {flight.duration}</span>
          <span className="flight-tag-dot" />
          <span className="flight-tag">{flight.cabinClass}</span>
        </div>
        <div className="flight-card-actions">
          {riskDetails && onViewRisk && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              onClick={() => onViewRisk(flight, riskDetails)}
            >
              <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
              Risk Insights
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleViewDetails}>
            View Details
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSelect}>
            <Zap size={14} /> Select
          </button>
        </div>
      </div>
    </div>
  );
}
