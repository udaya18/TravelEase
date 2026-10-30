import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plane, Clock, Luggage, ShieldCheck, ArrowLeft, Check,
  AlertCircle, Utensils, Heart, Share2, Info, ArrowRight
} from 'lucide-react';
import { useFlightById } from '../hooks/useFlights';
import { useTravelStore } from '../store/travelStore';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface FareTier {
  id: string;
  name: string;
  extraPrice: number;
  perks: string[];
  baggage: string;
  refundPolicy: string;
}

const fareTiers: FareTier[] = [
  {
    id: 'saver',
    name: 'Standard Saver',
    extraPrice: 0,
    perks: ['Standard Seat Selection', 'Standard Boarding'],
    baggage: '7kg Cabin + 15kg Check-in',
    refundPolicy: 'Cancellation fee of ₹3,000 applies',
  },
  {
    id: 'flexi',
    name: 'Flexi Plus',
    extraPrice: 750,
    perks: ['Free Seat Selection (All rows)', 'Complimentary Snack & Beverage', 'Priority Baggage Handling'],
    baggage: '7kg Cabin + 20kg Check-in (+5kg bonus)',
    refundPolicy: 'Reduced cancellation fee of ₹1,000',
  },
  {
    id: 'super',
    name: 'Super Flex',
    extraPrice: 1500,
    perks: ['Unlimited Date Change without fee', 'Hot Gourmet Meal included', 'Priority Check-in & Boarding'],
    baggage: '7kg Cabin + 25kg Check-in',
    refundPolicy: '100% Refund on cancellation up to 4 hrs before flight',
  },
];

const seatRows = [1, 2, 3, 4, 5, 6];
const seatColsLeft = ['A', 'B', 'C'];
const seatColsRight = ['D', 'E', 'F'];

export default function FlightDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: flight, isLoading, isError } = useFlightById(id || '');

  const {
    flightSearchParams,
    selectFlight,
    setPriceBreakdown,
  } = useTravelStore();

  const travellersCount = Number(flightSearchParams?.travellers || 1);

  // User selections
  const [selectedFareTier, setSelectedFareTier] = useState<string>('saver');
  const [selectedSeat, setSelectedSeat] = useState<string>('3B');
  const [showSeatMap, setShowSeatMap] = useState<boolean>(false);
  const [addInsurance, setAddInsurance] = useState<boolean>(true);
  const [addMeal, setAddMeal] = useState<boolean>(false);

  const currentFareTier = useMemo(() => {
    return fareTiers.find(f => f.id === selectedFareTier) || fareTiers[0];
  }, [selectedFareTier]);

  if (isLoading) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner text="Fetching flight itinerary details..." />
      </div>
    );
  }

  if (isError || !flight) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem' }}>
        <div className="container">
          <EmptyState
            title="Flight Not Found"
            description="The requested flight schedule is either unavailable or has expired."
            action={<button className="btn btn-primary" onClick={() => navigate('/flights')}>Back to Flights</button>}
          />
        </div>
      </div>
    );
  }

  // Price calculations
  const basePricePerPerson = flight.price + currentFareTier.extraPrice;
  const baseTotal = basePricePerPerson * travellersCount;
  const taxes = Math.round(baseTotal * 0.12);
  const insurancePrice = addInsurance ? 249 * travellersCount : 0;
  const mealPrice = addMeal ? 350 * travellersCount : 0;
  const convenienceFee = 149;
  const grandTotal = baseTotal + taxes + insurancePrice + mealPrice + convenienceFee;

  const handleProceed = () => {
    selectFlight(flight);

    setPriceBreakdown({
      baseFare: baseTotal,
      taxes,
      convenienceFee,
      discount: 0,
      total: grandTotal,
    });

    navigate('/checkout?type=flight');
  };

  return (
    <div className="page-wrapper">
      {/* Top Breadcrumbs */}
      <div className="page-header" style={{ padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="breadcrumb" style={{ margin: 0 }}>
            <button
              onClick={() => navigate('/flights')}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={16} /> All Flights
            </button>
            <span className="breadcrumb-sep">/</span>
            <span>{flight.fromCity} ({flight.from}) → {flight.toCity} ({flight.to})</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ fontWeight: 600 }}>{flight.flightNumber}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Heart size={16} /> Save
            </button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        {/* Main Grid: Flight Card & Rules (2 cols) vs Price Widget (1 col) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
          <div>
            {/* Flight Overview Card */}
            <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid var(--primary)' }}>
              <div className="card-body">
                {/* Airline & Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        background: 'var(--primary-50)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        fontSize: '1rem',
                        border: '1px solid var(--primary-100)',
                      }}
                    >
                      {flight.airlineCode}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{flight.airline}</h3>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                        Flight {flight.flightNumber} · Boeing 737 / A320
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge-primary">{flight.cabinClass}</span>
                    {flight.refundable ? (
                      <span className="tag tag-green">Refundable</span>
                    ) : (
                      <span className="tag tag-red">Non-refundable</span>
                    )}
                  </div>
                </div>

                {/* Journey Timeline */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.5rem',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem',
                    gap: '1rem',
                  }}
                >
                  {/* Origin */}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)' }}>{flight.departureTime}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{flight.from}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{flight.fromCity}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>Terminal 1</div>
                  </div>

                  {/* Flight Duration and Track */}
                  <div style={{ flex: 1, textAlign: 'center', maxWidth: 280, padding: '0 1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.375rem', fontWeight: 600 }}>
                      {flight.duration}
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100%', height: 2, background: 'var(--gray-300)' }} />
                      <Plane
                        size={18}
                        style={{
                          position: 'absolute',
                          color: 'var(--primary)',
                          background: 'var(--gray-50)',
                          padding: '0 4px',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: flight.stops === 0 ? 'var(--success)' : 'var(--accent)', marginTop: '0.375rem', fontWeight: 600 }}>
                      {flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop (${flight.stopInfo || 'Layover'})`}
                    </div>
                  </div>

                  {/* Destination */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)' }}>{flight.arrivalTime}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{flight.to}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{flight.toCity}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>Terminal 3</div>
                  </div>
                </div>

                {/* Baggage Information */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Luggage size={20} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Cabin Baggage</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{flight.cabinBaggage} / person</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Luggage size={20} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Check-in Baggage</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{flight.baggage} / person</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Cancellation</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{flight.cancellationPolicy}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fare Options */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Choose Your Fare Option</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.25rem' }}>
                  Upgrade for flexible cancellation policies, extra baggage, and free meal privileges
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {fareTiers.map(tier => {
                    const isSelected = selectedFareTier === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedFareTier(tier.id)}
                        style={{
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          background: isSelected ? 'var(--primary-50)' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{tier.name}</h4>
                            {isSelected && (
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={14} />
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                            {tier.extraPrice === 0 ? 'Included' : `+₹${tier.extraPrice.toLocaleString('en-IN')}`}
                          </div>

                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                            {tier.baggage}
                          </div>

                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                            {tier.perks.map((p, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', marginBottom: '0.375rem' }}>
                                <Check size={13} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', borderTop: '1px solid var(--gray-200)', paddingTop: '0.5rem' }}>
                          {tier.refundPolicy}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Seat Selection Preview */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Seat Selection</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', margin: '0.25rem 0 0 0' }}>
                      Selected Seat: <strong style={{ color: 'var(--primary)' }}>{selectedSeat} (Window)</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowSeatMap(!showSeatMap)}
                  >
                    {showSeatMap ? 'Close Seat Map' : 'Select Seat on Map'}
                  </button>
                </div>

                {showSeatMap && (
                  <div style={{ background: 'var(--gray-50)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--gray-600)' }}>
                      Front of Aircraft / Cockpit
                    </div>

                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {seatRows.map(row => (
                        <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          {/* Left 3 seats */}
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {seatColsLeft.map(col => {
                              const seatId = `${row}${col}`;
                              const isTaken = seatId === '1A' || seatId === '2C';
                              const isCurrent = selectedSeat === seatId;
                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isTaken}
                                  onClick={() => setSelectedSeat(seatId)}
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 'var(--radius-sm)',
                                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                                    background: isCurrent ? 'var(--primary)' : isTaken ? 'var(--gray-200)' : '#fff',
                                    color: isCurrent ? '#fff' : isTaken ? 'var(--gray-400)' : 'var(--gray-800)',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: isTaken ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>

                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', width: 20 }}>
                            {row}
                          </span>

                          {/* Right 3 seats */}
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            {seatColsRight.map(col => {
                              const seatId = `${row}${col}`;
                              const isTaken = seatId === '3E' || seatId === '5D';
                              const isCurrent = selectedSeat === seatId;
                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isTaken}
                                  onClick={() => setSelectedSeat(seatId)}
                                  style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 'var(--radius-sm)',
                                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--gray-300)',
                                    background: isCurrent ? 'var(--primary)' : isTaken ? 'var(--gray-200)' : '#fff',
                                    color: isCurrent ? '#fff' : isTaken ? 'var(--gray-400)' : 'var(--gray-800)',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: isTaken ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Add-ons */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Recommended Add-ons</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Travel Insurance */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.875rem',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: addInsurance ? '1px solid var(--primary)' : '1px solid var(--gray-200)',
                      background: addInsurance ? 'var(--primary-50)' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={addInsurance}
                      onChange={e => setAddInsurance(e.target.checked)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.95rem' }}>Comprehensive Travel Insurance</strong>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹249 / person</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', margin: '0.25rem 0 0 0' }}>
                        Covers flight delay compensation up to ₹10,000, medical emergency up to ₹2,50,000, and lost luggage.
                      </p>
                    </div>
                  </label>

                  {/* Hot Meal */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.875rem',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: addMeal ? '1px solid var(--primary)' : '1px solid var(--gray-200)',
                      background: addMeal ? 'var(--primary-50)' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={addMeal}
                      onChange={e => setAddMeal(e.target.checked)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.95rem' }}>Pre-book Hot Gourmet Meal</strong>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹350 / person</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', margin: '0.25rem 0 0 0' }}>
                        Choice of Vegetarian or Non-Vegetarian fresh gourmet platter with beverage.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Price Summary Sidebar */}
          <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
            <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="card-body">
                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                  Fare Summary
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Base Fare ({travellersCount} Passenger{travellersCount > 1 ? 's' : ''})</span>
                    <span>₹{(flight.price * travellersCount).toLocaleString('en-IN')}</span>
                  </div>

                  {currentFareTier.extraPrice > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Fare Upgrade ({currentFareTier.name})</span>
                      <span>₹{(currentFareTier.extraPrice * travellersCount).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Taxes & Aviation Fees</span>
                    <span>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>

                  {addInsurance && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Travel Insurance</span>
                      <span>₹{insurancePrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {addMeal && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Pre-booked Meals</span>
                      <span>₹{mealPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Convenience Fee</span>
                    <span>₹{convenienceFee}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 48, fontSize: '1rem', fontWeight: 700 }}
                  onClick={handleProceed}
                >
                  Proceed to Traveller Details
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.75rem' }}>
                  Seats remaining: {flight.seatAvailability} · Free 24-hr lock
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
