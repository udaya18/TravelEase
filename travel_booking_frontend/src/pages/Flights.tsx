import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Search, SlidersHorizontal, X, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';
import { useFlights } from '../hooks/useFlights';
import { useTravelStore } from '../store/travelStore';
import { riskApi, type RiskScoreDetails, type RankingCriteria } from '../api/riskApi';
import FlightCard from '../components/FlightCard';
import RiskInsightsModal from '../components/RiskInsightsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import type { FlightSearchParams, Flight } from '../types/flight';
import { AIRPORT_LOCATIONS } from '../data/travelLocations';

const airlines = ['Air India', 'IndiGo', 'Vistara', 'Akasa Air', 'SpiceJet'];
const stopOptions = [{ label: 'Non-stop', value: 0 }, { label: '1 Stop', value: 1 }, { label: '2+ Stops', value: 2 }];
const sortOptions = ['Recommended (Risk-Aware)', 'Lowest Risk', 'Cheapest', 'Fastest', 'Earliest'];

export default function Flights() {
  const navigate = useNavigate();
  const { flightSearchParams } = useTravelStore();
  const today = new Date().toISOString().split('T')[0];

  // Search form
  const [from, setFrom] = useState(String(flightSearchParams?.from || ''));
  const [to, setTo] = useState(String(flightSearchParams?.to || ''));
  const [departure, setDeparture] = useState(String(flightSearchParams?.departureDate || today));
  const [travellers, setTravellers] = useState(String(flightSearchParams?.travellers || '1'));
  const [cabinClass, setCabinClass] = useState(String(flightSearchParams?.cabinClass || 'Economy'));
  const [searched, setSearched] = useState(!!flightSearchParams);
  const [searchQuery, setSearchQuery] = useState<FlightSearchParams | null>(
    flightSearchParams ? {
      from: String(flightSearchParams.from),
      to: String(flightSearchParams.to),
      departureDate: String(flightSearchParams.departureDate),
      travellers: Number(flightSearchParams.travellers),
      cabinClass: String(flightSearchParams.cabinClass),
      tripType: 'one-way',
    } : null
  );

  // Filters & Sorting
  const [priceMax, setPriceMax] = useState(20000);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended (Risk-Aware)');
  const [showFilters, setShowFilters] = useState(false);

  // Risk Telemetry State
  const [riskMap, setRiskMap] = useState<Record<string, RiskScoreDetails>>({});
  const [riskLoading, setRiskLoading] = useState(false);
  const [selectedRiskModal, setSelectedRiskModal] = useState<{ flight: Flight; details: RiskScoreDetails } | null>(null);

  const { data: flights, isLoading, isError, refetch } = useFlights(searchQuery || undefined);

  // Fetch AI Risk Scores when search results or sort criterion changes
  useEffect(() => {
    let isMounted = true;
    const fetchRiskRanks = async () => {
      setRiskLoading(true);
      try {
        let criteria: RankingCriteria = 'BALANCED';
        if (sortBy === 'Lowest Risk') criteria = 'LOWEST_RISK';
        else if (sortBy === 'Fastest') criteria = 'FASTEST';
        else if (sortBy === 'Cheapest') criteria = 'BUDGET';

        const cleanFrom = from.includes('(') ? from.split('(')[0].trim() : from;
        const cleanTo = to.includes('(') ? to.split('(')[0].trim() : to;
        const ranked = await riskApi.rankFlights(cleanFrom, cleanTo, criteria);
        if (isMounted && Array.isArray(ranked)) {
          const map: Record<string, RiskScoreDetails> = {};
          ranked.forEach(r => {
            if (r.flight && r.flight.flightId) {
              map[String(r.flight.flightId)] = r.riskDetails;
            }
          });
          setRiskMap(map);
        }
      } catch (err) {
        console.error('Failed to load risk rankings:', err);
      } finally {
        if (isMounted) setRiskLoading(false);
      }
    };

    fetchRiskRanks();
    return () => { isMounted = false; };
  }, [from, to, sortBy, flights]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: FlightSearchParams = { from, to, departureDate: departure, travellers: Number(travellers), cabinClass, tripType: 'one-way' };
    setSearchQuery(params);
    setSearched(true);
  };

  const toggleAirline = (a: string) => setSelectedAirlines(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  const toggleStop = (s: number) => setSelectedStops(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const filteredFlights = useMemo(() => {
    if (!flights) return [];
    let result = [...flights];
    if (selectedAirlines.length) result = result.filter(f => selectedAirlines.includes(f.airline));
    if (selectedStops.length) result = result.filter(f => selectedStops.includes(f.stops));
    if (refundableOnly) result = result.filter(f => f.refundable);
    result = result.filter(f => f.price <= priceMax);

    if (sortBy === 'Recommended (Risk-Aware)') {
      result.sort((a, b) => {
        const scoreA = riskMap[String(a.flightId)]?.recommendationScore ?? 50;
        const scoreB = riskMap[String(b.flightId)]?.recommendationScore ?? 50;
        return scoreB - scoreA;
      });
    } else if (sortBy === 'Lowest Risk') {
      result.sort((a, b) => {
        const riskA = riskMap[String(a.flightId)]?.riskScore ?? 50;
        const riskB = riskMap[String(b.flightId)]?.riskScore ?? 50;
        return riskA - riskB;
      });
    } else if (sortBy === 'Cheapest') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Fastest') {
      const parseDuration = (d: string) => {
        const hMatch = d.match(/(\d+)\s*h/i);
        const mMatch = d.match(/(\d+)\s*m/i);
        const h = hMatch ? parseInt(hMatch[1], 10) : 0;
        const m = mMatch ? parseInt(mMatch[1], 10) : 0;
        return h * 60 + m;
      };
      result.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
    } else if (sortBy === 'Earliest') {
      result.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    }

    return result;
  }, [flights, selectedAirlines, selectedStops, refundableOnly, priceMax, sortBy, riskMap]);

  const clearFilters = () => {
    setSelectedAirlines([]); setSelectedStops([]); setRefundableOnly(false); setPriceMax(20000);
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Flights</span>
          </div>
          <h1><Plane size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />Search Flights</h1>
          <p>Find the best deals on flights across India and beyond</p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: '2rem' }}>
        <div className="container">
          {/* Search Bar */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label className="form-label">From</label>
                    <input className="form-control" placeholder="City/Airport" value={from} onChange={e => setFrom(e.target.value)} list="cities-from" />
                    <datalist id="cities-from">
                      {AIRPORT_LOCATIONS.map(a => (
                        <option key={a.code} value={a.label} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">To</label>
                    <input className="form-control" placeholder="City/Airport" value={to} onChange={e => setTo(e.target.value)} list="cities-to" />
                    <datalist id="cities-to">
                      {AIRPORT_LOCATIONS.map(a => (
                        <option key={a.code} value={a.label} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Departure</label>
                    <input className="form-control" type="date" min={today} value={departure} onChange={e => setDeparture(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Travellers</label>
                    <select className="form-control" value={travellers} onChange={e => setTravellers(e.target.value)}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class</label>
                    <select className="form-control" value={cabinClass} onChange={e => setCabinClass(e.target.value)}>
                      <option>Economy</option><option>Premium Economy</option><option>Business</option><option>First Class</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                    <Search size={16} /> Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {searched && (
            <div className="results-layout">
              {/* Sidebar Filters — Desktop */}
              <div className="filter-sidebar" style={{ display: showFilters ? 'block' : undefined }}>
                <div className="filter-header">
                  <h3>Filters</h3>
                  <button className="filter-clear-btn" onClick={clearFilters}>Clear All</button>
                </div>

                <div className="filter-section">
                  <div className="filter-section-title">Price (per traveller)</div>
                  <input type="range" className="price-range-input" min={1000} max={30000} step={500} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
                    <span>₹1,000</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Up to ₹{priceMax.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-section-title">Airlines</div>
                  {airlines.map(a => (
                    <label key={a} className="filter-checkbox">
                      <input type="checkbox" checked={selectedAirlines.includes(a)} onChange={() => toggleAirline(a)} />
                      {a}
                    </label>
                  ))}
                </div>

                <div className="filter-section">
                  <div className="filter-section-title">Stops</div>
                  {stopOptions.map(s => (
                    <label key={s.value} className="filter-checkbox">
                      <input type="checkbox" checked={selectedStops.includes(s.value)} onChange={() => toggleStop(s.value)} />
                      {s.label}
                    </label>
                  ))}
                </div>

                <div className="filter-section">
                  <div className="filter-section-title">Cancellation</div>
                  <label className="filter-checkbox">
                    <input type="checkbox" checked={refundableOnly} onChange={e => setRefundableOnly(e.target.checked)} />
                    Refundable Only
                  </label>
                </div>
              </div>

              {/* Results */}
              <div>
                {/* Sort + count */}
                <div className="sort-bar">
                  <span className="sort-label">Sort by:</span>
                  <div className="sort-options">
                    {sortOptions.map(s => (
                      <button key={s} className={`sort-option ${sortBy === s ? 'active' : ''}`} onClick={() => setSortBy(s)}>{s}</button>
                    ))}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => setShowFilters(f => !f)}
                    aria-label="Toggle filters on mobile"
                  >
                    <SlidersHorizontal size={15} /> Filters
                  </button>
                </div>

                <div className="search-results-header" style={{ marginBottom: '0.5rem' }}>
                  <span className="results-count">
                    Showing <strong>{filteredFlights.length}</strong> flights
                    {from && to ? ` from ${from} to ${to}` : ''}
                  </span>
                </div>

                {/* Rule-Based Travel Risk Assessment Active Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#166534' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} />
                    <span>
                      <strong>Rule-Based Travel Risk Assessment:</strong> Options ranked by safety, connection buffers, duration & price using predefined business rules.
                    </span>
                  </div>
                  {riskLoading && <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>Assessing risk rules...</span>}
                </div>

                {isLoading && <LoadingSpinner text="Searching for the best flights..." />}
                {isError && (
                  <div className="error-state">
                    <h3>Something went wrong</h3>
                    <p>Unable to load flights. Please try again.</p>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => refetch()}>Retry</button>
                  </div>
                )}
                {!isLoading && !isError && filteredFlights.length === 0 && (
                  <EmptyState
                    title="No flights found"
                    description="Try adjusting your filters or search for a different route or date."
                    action={<button className="btn btn-primary" onClick={clearFilters}><X size={16} /> Clear Filters</button>}
                  />
                )}
                {!isLoading && (
                  <div className="flights-list">
                    {filteredFlights.map(flight => (
                      <FlightCard
                        key={flight.flightId}
                        flight={flight}
                        riskDetails={riskMap[String(flight.flightId)]}
                        onViewRisk={(f, d) => setSelectedRiskModal({ flight: f, details: d })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!searched && (
            <div className="empty-state">
              <div className="empty-state-icon"><Plane size={36} /></div>
              <h3>Search for Flights</h3>
              <p>Enter your travel details above and click Search to find available flights.</p>
            </div>
          )}
        </div>
      </div>

      <RiskInsightsModal
        isOpen={!!selectedRiskModal}
        onClose={() => setSelectedRiskModal(null)}
        title={selectedRiskModal ? `${selectedRiskModal.flight.airline} (${selectedRiskModal.flight.flightNumber}) Risk Profile` : ''}
        subtitle={selectedRiskModal ? `${selectedRiskModal.flight.from} → ${selectedRiskModal.flight.to} · Scheduled at ${selectedRiskModal.flight.departureTime}` : ''}
        riskDetails={selectedRiskModal ? selectedRiskModal.details : null}
      />
    </div>
  );
}
