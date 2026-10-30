import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel as HotelIcon, Search, SlidersHorizontal, X, MapPin, Calendar, Users } from 'lucide-react';
import { useHotels } from '../hooks/useHotels';
import { useTravelStore } from '../store/travelStore';
import HotelCard from '../components/HotelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { HotelSearchParams } from '../types/hotel';
import { HOTEL_DESTINATIONS } from '../data/travelLocations';

const amenitiesList = [
  'Free WiFi',
  'Swimming Pool',
  'Spa',
  'Gym',
  'Restaurant',
  'Room Service',
  'Valet Parking',
  'Bar',
];

const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Guest Rating'];

export default function Hotels() {
  const navigate = useNavigate();
  const { hotelSearchParams, setHotelSearchParams } = useTravelStore();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [destination, setDestination] = useState(String(hotelSearchParams?.destination || ''));
  const [checkIn, setCheckIn] = useState(String(hotelSearchParams?.checkIn || today));
  const [checkOut, setCheckOut] = useState(String(hotelSearchParams?.checkOut || tomorrow));
  const [guests, setGuests] = useState(String(hotelSearchParams?.guests || '2'));
  const [rooms, setRooms] = useState(String(hotelSearchParams?.rooms || '1'));
  const [searched, setSearched] = useState(true);

  // Filters
  const [priceMax, setPriceMax] = useState(25000);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [breakfastIncludedOnly, setBreakfastIncludedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');
  const [showFilters, setShowFilters] = useState(false);

  const queryParams: HotelSearchParams = useMemo(() => {
    let cleanDest = destination.trim();
    if (cleanDest.includes(',')) {
      cleanDest = cleanDest.split(',')[0].trim();
    }
    return {
      destination: cleanDest,
      checkIn,
      checkOut,
      guests: Number(guests),
      rooms: Number(rooms),
    };
  }, [destination, checkIn, checkOut, guests, rooms]);

  const { data: hotels, isLoading, isError, refetch } = useHotels(searched ? queryParams : undefined);

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const diffTime = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHotelSearchParams(queryParams as unknown as Record<string, string | number>);
    setSearched(true);
  };

  const toggleStar = (star: number) => {
    setSelectedStars(prev => prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const clearFilters = () => {
    setPriceMax(25000);
    setSelectedStars([]);
    setSelectedAmenities([]);
    setFreeCancellationOnly(false);
    setBreakfastIncludedOnly(false);
  };

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    let result = [...hotels];

    if (selectedStars.length > 0) {
      result = result.filter(h => selectedStars.includes(h.starRating));
    }

    if (selectedAmenities.length > 0) {
      result = result.filter(h => selectedAmenities.every(a => h.amenities.includes(a)));
    }

    if (freeCancellationOnly) {
      result = result.filter(h => h.freeCancellation);
    }

    if (breakfastIncludedOnly) {
      result = result.filter(h => h.breakfastIncluded);
    }

    result = result.filter(h => h.pricePerNight <= priceMax);

    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (sortBy === 'Guest Rating') {
      result.sort((a, b) => b.guestRating - a.guestRating);
    }

    return result;
  }, [hotels, selectedStars, selectedAmenities, freeCancellationOnly, breakfastIncludedOnly, priceMax, sortBy]);

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Hotels</span>
          </div>
          <h1>
            <HotelIcon size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Find Your Ideal Stay
          </h1>
          <p>Book premium hotels, luxury resorts, and cozy stays across top destinations</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          {/* Search Form Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Destination
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Hyderabad, Goa, Mumbai"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      list="dest-options"
                    />
                    <datalist id="dest-options">
                      {HOTEL_DESTINATIONS.map(d => (
                        <option key={d.city} value={d.label} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Check-in
                    </label>
                    <input
                      className="form-control"
                      type="date"
                      min={today}
                      value={checkIn}
                      onChange={e => setCheckIn(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Check-out
                    </label>
                    <input
                      className="form-control"
                      type="date"
                      min={checkIn || today}
                      value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Users size={14} style={{ display: 'inline', marginRight: '0.25rem' }} /> Guests & Rooms
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select className="form-control" value={guests} onChange={e => setGuests(e.target.value)} title="Guests">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <select className="form-control" value={rooms} onChange={e => setRooms(e.target.value)} title="Rooms">
                        {[1, 2, 3, 4].map(n => (
                          <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: 44 }}>
                    <Search size={16} /> Search Hotels
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Results Layout */}
          <div className="results-layout">
            {/* Sidebar Filters */}
            <aside className={`filter-sidebar ${showFilters ? 'mobile-visible' : ''}`}>
              <div className="filter-header">
                <h3>Filters</h3>
                <button className="filter-clear-btn" onClick={clearFilters}>Clear All</button>
              </div>

              {/* Price Filter */}
              <div className="filter-section">
                <div className="filter-section-title">Max Price per Night</div>
                <input
                  type="range"
                  className="price-range-input"
                  min={2000}
                  max={30000}
                  step={1000}
                  value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
                  <span>₹2,000</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Up to ₹{priceMax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Star Rating Filter */}
              <div className="filter-section">
                <div className="filter-section-title">Star Rating</div>
                {[5, 4, 3].map(star => (
                  <label key={star} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStars.includes(star)}
                      onChange={() => toggleStar(star)}
                    />
                    <span>{star} Stars {'★'.repeat(star)}</span>
                  </label>
                ))}
              </div>

              {/* Special Features */}
              <div className="filter-section">
                <div className="filter-section-title">Perks & Flexibility</div>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={freeCancellationOnly}
                    onChange={e => setFreeCancellationOnly(e.target.checked)}
                  />
                  <span>Free Cancellation</span>
                </label>
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={breakfastIncludedOnly}
                    onChange={e => setBreakfastIncludedOnly(e.target.checked)}
                  />
                  <span>Free Breakfast</span>
                </label>
              </div>

              {/* Amenities */}
              <div className="filter-section">
                <div className="filter-section-title">Amenities</div>
                {amenitiesList.map(a => (
                  <label key={a} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(a)}
                      onChange={() => toggleAmenity(a)}
                    />
                    <span>{a}</span>
                  </label>
                ))}
              </div>
            </aside>

            {/* Results Content */}
            <main className="results-content">
              <div className="results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {destination ? `Hotels in ${destination}` : 'Available Hotels'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    Showing {filteredHotels.length} propert{filteredHotels.length === 1 ? 'y' : 'ies'} · {nights} night{nights > 1 ? 's' : ''}
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

              {/* Status states */}
              {isLoading && <LoadingSpinner text="Searching best hotel deals..." />}

              {isError && (
                <EmptyState
                  title="Failed to load hotels"
                  description="We couldn't retrieve hotel data. Please try again."
                  action={<button className="btn btn-primary" onClick={() => refetch()}>Try Again</button>}
                />
              )}

              {!isLoading && !isError && filteredHotels.length === 0 && (
                <EmptyState
                  title="No hotels found"
                  description="Try widening your price range or adjusting selected amenities and dates."
                  action={<button className="btn btn-outline" onClick={clearFilters}>Reset Filters</button>}
                />
              )}

              {!isLoading && !isError && filteredHotels.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {filteredHotels.map(hotel => (
                    <HotelCard key={hotel.hotelId} hotel={hotel} nights={nights} />
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
