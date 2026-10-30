import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Search, SlidersHorizontal, X, MapPin, Calendar, Clock,
  Shield, CheckCircle2, Award, Zap
} from 'lucide-react';
import { useCabs } from '../hooks/useCabs';
import { useTravelStore } from '../store/travelStore';
import CabCard from '../components/CabCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { CabSearchParams } from '../types/cab';
import { CAB_PICKUP_LOCATIONS, CAB_DROP_LOCATIONS } from '../data/travelLocations';

const cabTypes = ['All', 'Sedan', 'SUV', 'Hatchback', 'Premium', 'Mini'];
const sortOptions = ['Recommended', 'Price: Low to High', 'Driver Rating'];

export default function Cabs() {
  const navigate = useNavigate();
  const { cabSearchParams, setCabSearchParams } = useTravelStore();

  const today = new Date().toISOString().split('T')[0];

  const [pickup, setPickup] = useState(String(cabSearchParams?.pickup || ''));
  const [drop, setDrop] = useState(String(cabSearchParams?.drop || ''));
  const [date, setDate] = useState(String(cabSearchParams?.date || today));
  const [time, setTime] = useState(String(cabSearchParams?.time || '10:00'));
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searched, setSearched] = useState(true);

  // Filters
  const [acOnly, setAcOnly] = useState(false);
  const [minRating, setMinRating] = useState(4.0);
  const [maxPrice, setMaxPrice] = useState(3500);
  const [sortBy, setSortBy] = useState('Recommended');
  const [showFilters, setShowFilters] = useState(false);

  const queryParams: CabSearchParams = useMemo(() => ({
    pickup,
    drop,
    date,
    time,
    cabType: selectedType !== 'All' ? (selectedType as any) : undefined,
  }), [pickup, drop, date, time, selectedType]);

  const { data: cabs, isLoading, isError, refetch } = useCabs(searched ? queryParams : undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCabSearchParams(queryParams as any);
    setSearched(true);
  };

  const clearFilters = () => {
    setSelectedType('All');
    setAcOnly(false);
    setMinRating(4.0);
    setMaxPrice(3500);
  };

  const filteredCabs = useMemo(() => {
    if (!cabs) return [];
    let result = [...cabs];

    if (selectedType !== 'All') {
      result = result.filter(c => c.cabType === selectedType);
    }

    if (acOnly) {
      result = result.filter(c => c.isAC);
    }

    result = result.filter(c => c.driverRating >= minRating && c.totalFare <= maxPrice);

    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.totalFare - b.totalFare);
    } else if (sortBy === 'Driver Rating') {
      result.sort((a, b) => b.driverRating - a.driverRating);
    }

    return result;
  }, [cabs, selectedType, acOnly, minRating, maxPrice, sortBy]);

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Cabs</span>
          </div>
          <h1>
            <Car size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Book Airport Cabs & City Rides
          </h1>
          <p>Guaranteed on-time pickups, verified chauffeurs, and zero surge pricing</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          {/* Search Form */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.875rem', alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Pickup Location
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Hyderabad Airport"
                      value={pickup}
                      onChange={e => setPickup(e.target.value)}
                      list="pickup-options"
                    />
                    <datalist id="pickup-options">
                      {CAB_PICKUP_LOCATIONS.map(p => (
                        <option key={p.location} value={p.location} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem', color: 'var(--error)' }} /> Drop Destination
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Banjara Hills, Gachibowli"
                      value={drop}
                      onChange={e => setDrop(e.target.value)}
                      list="drop-options"
                    />
                    <datalist id="drop-options">
                      {CAB_DROP_LOCATIONS.map(d => (
                        <option key={d.location} value={d.location} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Pickup Date
                    </label>
                    <input
                      className="form-control"
                      type="date"
                      min={today}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Pickup Time
                    </label>
                    <input
                      className="form-control"
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: 44 }}>
                    <Search size={16} /> Search Cabs
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Value Badges Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Zero Surge Guarantee</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Fixed fares upfront</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
              <Zap size={20} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Instant Driver Assignment</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>No cancellation from driver</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Sanitised AC Vehicles</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Well maintained fleet</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)' }}>
              <Award size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Top-Rated Chauffeurs</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Minimum 4.3★ rating</div>
              </div>
            </div>
          </div>

          {/* Results Layout */}
          <div className="results-layout">
            {/* Filter Sidebar */}
            <aside className={`filter-sidebar ${showFilters ? 'mobile-visible' : ''}`}>
              <div className="filter-header">
                <h3>Filters</h3>
                <button className="filter-clear-btn" onClick={clearFilters}>Clear All</button>
              </div>

              {/* Cab Type Filter */}
              <div className="filter-section">
                <div className="filter-section-title">Vehicle Type</div>
                {cabTypes.map(t => (
                  <label key={t} className="filter-checkbox">
                    <input
                      type="radio"
                      name="cabType"
                      checked={selectedType === t}
                      onChange={() => setSelectedType(t)}
                    />
                    <span>{t === 'All' ? 'All Vehicle Types' : t}</span>
                  </label>
                ))}
              </div>

              {/* Price Filter */}
              <div className="filter-section">
                <div className="filter-section-title">Maximum Fare</div>
                <input
                  type="range"
                  className="price-range-input"
                  min={500}
                  max={5000}
                  step={100}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
                  <span>₹500</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Up to ₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Comfort & Rating */}
              <div className="filter-section">
                <div className="filter-section-title">Comfort Preferences</div>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={acOnly}
                    onChange={e => setAcOnly(e.target.checked)}
                  />
                  <span>Air Conditioned (AC) Only</span>
                </label>
              </div>

              <div className="filter-section">
                <div className="filter-section-title">Minimum Driver Rating</div>
                {[4.5, 4.0].map(r => (
                  <label key={r} className="filter-checkbox">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === r}
                      onChange={() => setMinRating(r)}
                    />
                    <span>{r}★ and above</span>
                  </label>
                ))}
              </div>
            </aside>

            {/* Results Content */}
            <main className="results-content">
              <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Available Cabs ({filteredCabs.length})
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    Pickups scheduled from {pickup || 'Hyderabad Airport'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm filter-toggle-btn"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
                    Filters
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Sort:</span>
                    <select
                      className="form-control"
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: 'auto' }}
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                    >
                      {sortOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {isLoading && <LoadingSpinner text="Searching available cabs near you..." />}

              {isError && (
                <EmptyState
                  title="Failed to load cabs"
                  description="We couldn't connect to cab dispatch. Please retry."
                  action={<button className="btn btn-primary" onClick={() => refetch()}>Try Again</button>}
                />
              )}

              {!isLoading && !isError && filteredCabs.length === 0 && (
                <EmptyState
                  title="No cabs match your filters"
                  description="Try adjusting your maximum fare limit or vehicle category preferences."
                  action={<button className="btn btn-outline" onClick={clearFilters}>Reset Filters</button>}
                />
              )}

              {!isLoading && !isError && filteredCabs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {filteredCabs.map(cab => (
                    <CabCard key={cab.cabId} cab={cab} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
