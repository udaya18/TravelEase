import { Plane, Hotel, Car, Trash2, Clock } from 'lucide-react';
import type { ItineraryItem } from '../types/itinerary';
import { useTravelStore } from '../store/travelStore';

interface ItineraryCardProps {
  item: ItineraryItem;
  showRemove?: boolean;
}

const typeConfig = {
  flight: { icon: Plane, label: 'Flight', colorClass: 'item-flight' },
  hotel: { icon: Hotel, label: 'Hotel', colorClass: 'item-hotel' },
  cab: { icon: Car, label: 'Cab', colorClass: 'item-cab' },
  activity: { icon: Clock, label: 'Activity', colorClass: 'item-flight' },
};

export default function ItineraryCard({ item, showRemove = true }: ItineraryCardProps) {
  const removeFromItinerary = useTravelStore((s) => s.removeFromItinerary);
  const config = typeConfig[item.type] || typeConfig.activity;
  const Icon = config.icon;

  return (
    <div className="itinerary-item-card">
      <div className={`itinerary-item-icon ${config.colorClass}`}>
        <Icon size={18} />
      </div>
      <div className="itinerary-item-info">
        <div className="itinerary-item-title">{item.title}</div>
        <div className="itinerary-item-desc">{item.description}</div>
        {item.time && (
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
            <Clock size={11} style={{ display: 'inline', marginRight: '0.25rem' }} />
            {item.time}
          </div>
        )}
      </div>
      <div className="itinerary-item-price">₹{item.price.toLocaleString('en-IN')}</div>
      {showRemove && (
        <button
          className="itinerary-remove-btn"
          onClick={() => removeFromItinerary(item.itemId)}
          aria-label={`Remove ${item.title} from itinerary`}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
