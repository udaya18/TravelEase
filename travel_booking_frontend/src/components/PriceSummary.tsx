import type { PriceBreakdown } from '../types/booking';
import { Tag } from 'lucide-react';

interface PriceSummaryProps {
  breakdown: PriceBreakdown;
  label?: string;
  showPromoInput?: boolean;
}

export default function PriceSummary({ breakdown, label = 'Price Summary', showPromoInput = false }: PriceSummaryProps) {
  return (
    <div className="price-summary-card">
      <div className="price-summary-header">
        <h3>{label}</h3>
      </div>
      <div className="price-summary-body">
        <div className="price-row">
          <span>Base Fare</span>
          <span>₹{breakdown.baseFare.toLocaleString('en-IN')}</span>
        </div>
        <div className="price-row">
          <span>Taxes & Fees</span>
          <span>₹{breakdown.taxes.toLocaleString('en-IN')}</span>
        </div>
        <div className="price-row">
          <span>Convenience Fee</span>
          <span>₹{breakdown.convenienceFee.toLocaleString('en-IN')}</span>
        </div>
        {breakdown.discount > 0 && (
          <div className="price-row discount">
            <span>Discount</span>
            <span>− ₹{breakdown.discount.toLocaleString('en-IN')}</span>
          </div>
        )}
        {showPromoInput && (
          <div style={{ margin: '0.75rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="form-control"
                placeholder="Promo code"
                style={{ flex: 1, fontSize: '0.875rem' }}
              />
              <button className="btn btn-secondary btn-sm">
                <Tag size={13} /> Apply
              </button>
            </div>
          </div>
        )}
        <div className="price-divider" />
        <div className="price-row total">
          <span>Total Amount</span>
          <span style={{ color: 'var(--primary)' }}>₹{breakdown.total.toLocaleString('en-IN')}</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.75rem', textAlign: 'center' }}>
          * Inclusive of GST and all applicable taxes
        </p>
      </div>
    </div>
  );
}
