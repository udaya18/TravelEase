import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Plus, Trash2, Calendar, Users, DollarSign, Download,
  Share2, Plane, Hotel as HotelIcon, Car, Sparkles, ArrowRight,
  ShieldCheck, RefreshCw, CheckCircle2, Luggage, Star, Clock,
  MapPin, Wind, Navigation, AlertCircle
} from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { mockFlights } from '../data/flights';
import { mockHotels } from '../data/hotels';
import { mockCabs } from '../data/cabs';
import { riskApi, type ItineraryRiskResponse } from '../api/riskApi';
import RiskBadge from '../components/RiskBadge';
import ItineraryCard from '../components/ItineraryCard';
import EmptyState from '../components/EmptyState';
import type { Itinerary, ItineraryItem, ItineraryItemType } from '../types/itinerary';

const defaultTripSchedule: Itinerary = {
  tripId: 'TRIP-CUSTOM-2026',
  tripName: 'Enchanting Goa Beach & Heritage Getaway',
  destination: 'Goa',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  travellers: 2,
  totalBudget: 28000,
  notes: 'Keep digital copies of vouchers and flight boarding passes handy.',
  items: [
    {
      itemId: 'ITEM-1',
      day: 1,
      type: 'activity',
      title: 'Resort Check-in & Poolside Welcome',
      description: 'Check in, unpack, and enjoy refreshing welcome drinks and sunset views.',
      time: '02:00 PM',
      location: 'Resort Lobby',
      price: 0,
      details: {},
    },
    {
      itemId: 'ITEM-2',
      day: 2,
      type: 'activity',
      title: 'Scuba Diving & Water Sports Safari',
      description: 'Includes boat cruise, diving gear, underwater video & beachside lunch.',
      time: '08:30 AM',
      location: 'Grand Island Jetty',
      price: 3500,
      details: {},
    },
    {
      itemId: 'ITEM-3',
      day: 2,
      type: 'activity',
      title: 'Sunset Cruise on Mandovi River',
      description: '2-hour river cruise with live Goan folk music, DJ and dance.',
      time: '05:30 PM',
      location: 'Panaji Jetty',
      price: 1200,
      details: {},
    },
    {
      itemId: 'ITEM-4',
      day: 3,
      type: 'activity',
      title: 'Old Goa Heritage Walk & Spice Farm Tour',
      description: 'Visit Basilica of Bom Jesus, Se Cathedral, followed by authentic lunch.',
      time: '09:30 AM',
      location: 'Old Goa & Ponda',
      price: 1800,
      details: {},
    },
  ],
};

export default function ItineraryPage() {
  const navigate = useNavigate();
  const {
    selectedFlight,
    selectedHotel,
    selectedRoom,
    selectedCab,
    selectFlight,
    removeFlight,
    selectHotel,
    removeHotel,
    selectCab,
    removeCab,
    loadSamplePackage,
    setPriceBreakdown,
    itinerary,
    initItinerary,
    addToItinerary,
    clearItinerary,
  } = useTravelStore();

  // Initialize schedule if empty
  useEffect(() => {
    if (!itinerary) {
      initItinerary(defaultTripSchedule);
    }
  }, [itinerary, initItinerary]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // New activity form state
  const [itemDay, setItemDay] = useState(1);
  const [itemType, setItemType] = useState<ItineraryItemType>('activity');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemTime, setItemTime] = useState('10:00 AM');
  const [itemLocation, setItemLocation] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // Individual service prices
  const flightPrice = selectedFlight ? selectedFlight.price : 0;
  const hotelPrice = selectedHotel ? (selectedRoom?.pricePerNight || selectedHotel.pricePerNight) : 0;
  const cabPrice = selectedCab ? selectedCab.totalFare : 0;

  // Selected services counter
  const selectedCount = (selectedFlight ? 1 : 0) + (selectedHotel ? 1 : 0) + (selectedCab ? 1 : 0);

  // Financial calculations
  const subtotal = flightPrice + hotelPrice + cabPrice;
  const taxes = Math.round(subtotal * 0.12);
  const convenienceFee = subtotal > 0 ? 149 : 0;
  // Special bundle discount when all 3 services (flight + hotel + cab) are combined
  const bundleDiscount = selectedCount === 3 ? 500 : selectedCount === 2 ? 250 : 0;
  const grandTotal = Math.max(0, subtotal + taxes + convenienceFee - bundleDiscount);

  // Current itinerary schedule
  const currentItinerary = itinerary || defaultTripSchedule;

  // Intelligent Travel Risk Assessment
  const [itineraryRisk, setItineraryRisk] = useState<ItineraryRiskResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  useEffect(() => {
    if (!selectedFlight && !selectedHotel && !selectedCab) {
      setItineraryRisk(null);
      return;
    }
    let isMounted = true;
    const assessRisk = async () => {
      setRiskLoading(true);
      try {
        const res = await riskApi.assessItinerary({
          flightId: selectedFlight?.flightId,
          hotelId: selectedHotel?.hotelId,
          cabId: selectedCab?.cabId,
          travelDate: currentItinerary.startDate,
          cabPickupTime: '12:15',
        });
        if (isMounted) setItineraryRisk(res);
      } catch (err) {
        console.error('Failed to assess itinerary risk:', err);
      } finally {
        if (isMounted) setRiskLoading(false);
      }
    };
    assessRisk();
    return () => { isMounted = false; };
  }, [selectedFlight, selectedHotel, selectedCab, currentItinerary.startDate]);

  // Group activity items by day
  const groupedItems = useMemo(() => {
    const groups: Record<number, ItineraryItem[]> = {};
    currentItinerary.items.forEach(item => {
      if (!groups[item.day]) groups[item.day] = [];
      groups[item.day].push(item);
    });
    return groups;
  }, [currentItinerary.items]);

  const daysList = Object.keys(groupedItems).map(Number).sort((a, b) => a - b);

  // Proceed to Checkout with all combined services
  const handleProceedToCheckout = () => {
    if (selectedCount === 0) {
      alert('Please select at least one service (Flight, Hotel, or Cab) before proceeding to checkout.');
      return;
    }

    setPriceBreakdown({
      baseFare: subtotal,
      taxes,
      convenienceFee,
      discount: bundleDiscount,
      total: grandTotal,
    });

    navigate('/checkout?type=package');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const newItem: ItineraryItem = {
      itemId: `ITEM-${Date.now()}`,
      day: Number(itemDay),
      type: itemType,
      title: itemTitle,
      description: itemDesc,
      time: itemTime,
      location: itemLocation,
      price: Number(itemPrice) || 0,
      details: {},
    };

    addToItinerary(newItem);
    setShowAddModal(false);
    setItemTitle('');
    setItemDesc('');
    setItemPrice('');
    setItemLocation('');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownload = () => {
    const textData = `
==================================================
TRAVELEASE COMBINED ITINERARY & TRIP PLANNER
Trip: ${currentItinerary.tripName}
Destination: ${currentItinerary.destination}
Dates: ${currentItinerary.startDate} to ${currentItinerary.endDate}
==================================================
COMBINED SELECTED SERVICES:
--------------------------------------------------
1. FLIGHT: ${selectedFlight ? `${selectedFlight.airline} (${selectedFlight.flightNumber}) - ${selectedFlight.from} to ${selectedFlight.to} @ ₹${flightPrice}` : 'Not Selected'}
2. HOTEL:  ${selectedHotel ? `${selectedHotel.hotelName} (${selectedRoom?.roomName || 'Deluxe Room'}) @ ₹${hotelPrice}` : 'Not Selected'}
3. CAB:    ${selectedCab ? `${selectedCab.vehicleName} (${selectedCab.cabType}) - ${selectedCab.pickup} to ${selectedCab.drop} @ ₹${cabPrice}` : 'Not Selected'}

--------------------------------------------------
PRICE BREAKDOWN:
Flight Price:     ₹${flightPrice.toLocaleString('en-IN')}
Hotel Price:      ₹${hotelPrice.toLocaleString('en-IN')}
Cab Price:        ₹${cabPrice.toLocaleString('en-IN')}
Subtotal:         ₹${subtotal.toLocaleString('en-IN')}
GST & Taxes (12%):₹${taxes.toLocaleString('en-IN')}
Convenience Fee:  ₹${convenienceFee}
Bundle Discount:  -₹${bundleDiscount}
TOTAL AMOUNT:     ₹${grandTotal.toLocaleString('en-IN')}
==================================================
SCHEDULE & ACTIVITIES:
${currentItinerary.items.map(i => `[Day ${i.day}] (${i.time || 'Anytime'}) ${i.title} - ₹${i.price}\n   ${i.description}`).join('\n\n')}
==================================================
`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `itinerary-${currentItinerary.destination.toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Itinerary Planner</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-primary">
                  {selectedCount}/3 Services Combined
                </span>
                {selectedCount === 3 && (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle2 size={12} /> Bundle Discount Applied (₹500 OFF)
                  </span>
                )}
              </div>
              <h1>
                <Compass size={28} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Combined Trip Itinerary
              </h1>
              <p>Review selected Flight, Hotel, and Cab together with individual prices and one-click combined checkout.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {selectedCount < 3 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={loadSamplePackage}
                  title="Auto-fill recommended Flight, Hotel, and Cab"
                >
                  <Sparkles size={15} style={{ color: 'var(--accent)' }} /> Load Recommended Package
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={handleShare}>
                <Share2 size={15} /> {copiedNotification ? 'Link Copied!' : 'Share Trip'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                <Download size={15} /> Export Plan
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={15} /> Add Activity
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Main 2-column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>

          {/* Left Column: Combined Selected Services & Timeline */}
          <div>
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
                  Selected Travel Services
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                  Combined bundle for your vacation
                </span>
              </div>
              {selectedCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--error)', fontSize: '0.8rem' }}
                  onClick={() => {
                    removeFlight();
                    removeHotel();
                    removeCab();
                  }}
                >
                  <Trash2 size={14} /> Clear All Services
                </button>
              )}
            </div>

            {/* Rule-Based Travel Risk Assessment Card */}
            {selectedCount > 0 && itineraryRisk && (
              <div
                className="card"
                style={{
                  marginBottom: '1.25rem',
                  borderLeft: `5px solid ${itineraryRisk.overallTripRiskLevel === 'LOW' ? '#059669' : itineraryRisk.overallTripRiskLevel === 'MEDIUM' ? '#d97706' : '#dc2626'}`,
                  background: itineraryRisk.overallTripRiskLevel === 'LOW' ? '#f0fdf4' : itineraryRisk.overallTripRiskLevel === 'MEDIUM' ? '#fffbeb' : '#fef2f2',
                }}
              >
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={22} style={{ color: itineraryRisk.overallTripRiskLevel === 'LOW' ? '#059669' : itineraryRisk.overallTripRiskLevel === 'MEDIUM' ? '#d97706' : '#dc2626' }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                          Rule-Based Travel Risk Assessment
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                          Evaluated using predefined business rules: flight stops, connection buffers, seat scarcity & duration
                        </span>
                      </div>
                    </div>
                    <RiskBadge
                      level={itineraryRisk.overallTripRiskLevel}
                      score={itineraryRisk.overallTripRiskScore}
                      recommendationScore={itineraryRisk.compositeRecommendationScore}
                      size="md"
                    />
                  </div>

                  {/* Buffer alert */}
                  <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span>Connection Transfer Window:</span>
                      <span style={{ color: itineraryRisk.transferBufferMinutes < 30 ? 'var(--error)' : 'var(--primary)' }}>
                        {itineraryRisk.transferBufferAssessment} ({itineraryRisk.transferBufferMinutes} mins)
                      </span>
                    </div>
                    {itineraryRisk.actionableMitigations && itineraryRisk.actionableMitigations.length > 0 && (
                      <div style={{ color: 'var(--gray-700)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                        <strong>Actionable Tip:</strong> {itineraryRisk.actionableMitigations[0]}
                      </div>
                    )}
                  </div>

                  {/* Key explanations */}
                  {itineraryRisk.tripLevelExplanations && itineraryRisk.tripLevelExplanations.length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-700)' }}>
                      <strong>Assessment Highlights:</strong>
                      <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0 }}>
                        {itineraryRisk.tripLevelExplanations.slice(0, 3).map((exp, i) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service 1: Flight Card */}
            <div
              className="card"
              style={{
                marginBottom: '1.25rem',
                border: selectedFlight ? '1px solid var(--primary-100, #e0e7ff)' : '2px dashed var(--gray-300)',
                background: selectedFlight ? '#fff' : 'var(--gray-50)',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: selectedFlight ? 'var(--primary-50)' : 'var(--gray-200)',
                        color: selectedFlight ? 'var(--primary)' : 'var(--gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plane size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)' }}>
                          Flight Reservation
                        </span>
                        {selectedFlight && (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {selectedFlight ? `${selectedFlight.airline} · ${selectedFlight.flightNumber}` : 'No flight selected'}
                      </span>
                    </div>
                  </div>

                  {/* Individual Price Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Individual Flight Price
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: selectedFlight ? 'var(--primary)' : 'var(--gray-400)' }}>
                      ₹{flightPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {selectedFlight ? (
                  <div>
                    {/* Flight Details Route Strip */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                        background: 'var(--gray-50)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Departure</div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{selectedFlight.departureTime}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{selectedFlight.fromCity} ({selectedFlight.from})</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{selectedFlight.duration}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.25rem 0' }}>
                          <div style={{ height: 2, background: 'var(--gray-300)', flex: 1 }} />
                          <ArrowRight size={14} style={{ color: 'var(--primary)', margin: '0 4px' }} />
                          <div style={{ height: 2, background: 'var(--gray-300)', flex: 1 }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>
                          {selectedFlight.stops === 0 ? 'Non-Stop' : `${selectedFlight.stops} Stop`}
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Arrival</div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{selectedFlight.arrivalTime}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{selectedFlight.toCity} ({selectedFlight.to})</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Class & Baggage</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedFlight.cabinClass}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}><Luggage size={11} style={{ display: 'inline', marginRight: 2 }} /> {selectedFlight.baggage}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/flights')}>
                        Change Flight
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={removeFlight}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      No flight selected for this trip. Browse flights or add our top-rated route with 1-click.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => selectFlight(mockFlights[0])}
                      >
                        + Add Air India (HYD → DEL)
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/flights')}>
                        Browse Flights
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service 2: Hotel Card */}
            <div
              className="card"
              style={{
                marginBottom: '1.25rem',
                border: selectedHotel ? '1px solid var(--primary-100, #e0e7ff)' : '2px dashed var(--gray-300)',
                background: selectedHotel ? '#fff' : 'var(--gray-50)',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: selectedHotel ? '#ecfdf5' : 'var(--gray-200)',
                        color: selectedHotel ? '#10b981' : 'var(--gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HotelIcon size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)' }}>
                          Hotel Accommodation
                        </span>
                        {selectedHotel && (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {selectedHotel ? `${selectedHotel.hotelName} · ${selectedHotel.location}` : 'No hotel selected'}
                      </span>
                    </div>
                  </div>

                  {/* Individual Price Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Individual Hotel Price
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: selectedHotel ? 'var(--primary)' : 'var(--gray-400)' }}>
                      ₹{hotelPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {selectedHotel ? (
                  <div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                        background: 'var(--gray-50)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Property & Rating</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedHotel.hotelName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={12} fill="var(--accent)" /> {selectedHotel.guestRating} ({selectedHotel.starRating}-Star)
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Room Type</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {selectedRoom?.roomName || selectedHotel.roomTypes?.[0]?.roomName || 'Deluxe Room'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Breakfast Included</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Stay Duration</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>3 Nights Stay</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Oct 15 - Oct 18, 2026</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Amenities</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-700)' }}>WiFi · Pool · Spa</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Free Cancellation</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/hotels')}>
                        Change Hotel
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={removeHotel}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      No hotel selected. Add a luxury or boutique stay to complete your package.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => selectHotel(mockHotels[0])}
                      >
                        + Add The Grand Hotel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/hotels')}>
                        Browse Hotels
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service 3: Cab Card */}
            <div
              className="card"
              style={{
                marginBottom: '2rem',
                border: selectedCab ? '1px solid var(--primary-100, #e0e7ff)' : '2px dashed var(--gray-300)',
                background: selectedCab ? '#fff' : 'var(--gray-50)',
                transition: 'all 0.2s ease',
              }}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: selectedCab ? '#fffbeb' : 'var(--gray-200)',
                        color: selectedCab ? '#f59e0b' : 'var(--gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Car size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gray-900)' }}>
                          Airport / City Cab Transfer
                        </span>
                        {selectedCab && (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {selectedCab ? `${selectedCab.vehicleName} · ${selectedCab.cabType}` : 'No cab selected'}
                      </span>
                    </div>
                  </div>

                  {/* Individual Price Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Individual Cab Price
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: selectedCab ? 'var(--primary)' : 'var(--gray-400)' }}>
                      ₹{cabPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {selectedCab ? (
                  <div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                        background: 'var(--gray-50)',
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Vehicle & Operator</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{selectedCab.vehicleName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{selectedCab.operator} · {selectedCab.cabType}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Pickup Location</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedCab.pickup}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Airport Chauffeur Meet</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Drop Location</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedCab.drop}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{selectedCab.distance} (~{selectedCab.estimatedDuration})</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase' }}>Chauffeur & AC</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>★ {selectedCab.driverRating} Rating</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{selectedCab.isAC ? 'Sanitised AC Sedan' : 'Non-AC'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/cabs')}>
                        Change Cab
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={removeCab}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      No cab reserved. Book airport pickup or local transfer to ensure zero wait time.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => selectCab(mockCabs[1] || mockCabs[0])}
                      >
                        + Add Sedan Cab (Airport Transfer)
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/cabs')}>
                        Browse Cabs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Day-by-Day Timeline Schedule */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
                    Daily Schedule & Activities
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Smart timeline coordinating your flight, cab, hotel, and sightseeing
                  </span>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(true)}>
                  <Plus size={15} /> Add Activity
                </button>
              </div>

              {daysList.length === 0 ? (
                <EmptyState
                  title="Your Schedule is Empty"
                  description="Start planning your days by clicking 'Add Activity'."
                  action={
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                      Add First Activity
                    </button>
                  }
                />
              ) : (
                daysList.map(dayNum => (
                  <div key={dayNum} style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div
                        style={{
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          padding: '0.375rem 0.875rem',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        Day {dayNum}
                      </div>
                      <div style={{ height: 1, flex: 1, background: 'var(--gray-200)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>
                        {groupedItems[dayNum].length} Activity / Event{groupedItems[dayNum].length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {groupedItems[dayNum].map(item => (
                        <ItineraryCard key={item.itemId} item={item} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Combined Pricing Summary & Proceed to Checkout */}
          <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
            <div
              className="card"
              style={{
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--primary-100, #e0e7ff)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                marginBottom: '1.5rem',
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, #312e81 100%)',
                  color: '#fff',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    Combined Booking Summary
                  </h3>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {selectedCount} Selected
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  One single transaction for all services
                </p>
              </div>

              <div className="card-body" style={{ padding: '1.5rem' }}>
                {/* Individual Prices List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Plane size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600 }}>Flight Fare</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>
                      {selectedFlight ? `₹${flightPrice.toLocaleString('en-IN')}` : <em style={{ color: 'var(--gray-400)', fontWeight: 400 }}>Not selected</em>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HotelIcon size={15} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: 600 }}>Hotel Stay</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>
                      {selectedHotel ? `₹${hotelPrice.toLocaleString('en-IN')}` : <em style={{ color: 'var(--gray-400)', fontWeight: 400 }}>Not selected</em>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Car size={15} style={{ color: '#f59e0b' }} />
                      <span style={{ fontWeight: 600 }}>Cab Transfer</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>
                      {selectedCab ? `₹${cabPrice.toLocaleString('en-IN')}` : <em style={{ color: 'var(--gray-400)', fontWeight: 400 }}>Not selected</em>}
                    </span>
                  </div>

                  <div style={{ height: 1, background: 'var(--gray-200)', margin: '0.25rem 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-600)' }}>
                    <span>Combined Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-600)' }}>
                    <span>Taxes & GST (12%)</span>
                    <span>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-600)' }}>
                    <span>Platform & Booking Fee</span>
                    <span>₹{convenienceFee}</span>
                  </div>

                  {bundleDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 700 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles size={14} /> Package Bundle Savings
                      </span>
                      <span>− ₹{bundleDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {/* Grand Total Highlight */}
                  <div
                    style={{
                      borderTop: '2px solid var(--gray-200)',
                      paddingTop: '1rem',
                      marginTop: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                        Total Amount
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        Includes all taxes & fees
                      </span>
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--primary)' }}>
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Proceed to Checkout Button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: 52,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  disabled={selectedCount === 0}
                  onClick={handleProceedToCheckout}
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>

                {selectedCount === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--error)', marginTop: '0.75rem', marginBottom: 0 }}>
                    Please select a flight, hotel, or cab to proceed.
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginTop: '1rem',
                      fontSize: '0.75rem',
                      color: 'var(--gray-500)',
                    }}
                  >
                    <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                    <span>256-bit Encrypted · Instant One-Click Booking</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Package Helpers */}
            <div className="card">
              <div className="card-body">
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Explore More Services
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => navigate('/flights')}
                  >
                    <Plane size={15} /> Explore Alternate Flights
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => navigate('/hotels')}
                  >
                    <HotelIcon size={15} /> Explore Alternate Hotels
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => navigate('/cabs')}
                  >
                    <Car size={15} /> Explore Alternate Cabs
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Add Trip Activity</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddItem}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Day</label>
                    <select
                      className="form-control"
                      value={itemDay}
                      onChange={e => setItemDay(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <option key={d} value={d}>Day {d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={itemType}
                      onChange={e => setItemType(e.target.value as ItineraryItemType)}
                    >
                      <option value="activity">Sightseeing / Activity</option>
                      <option value="flight">Flight</option>
                      <option value="hotel">Hotel Stay</option>
                      <option value="cab">Cab / Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Title</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Scuba Diving at Grand Island"
                    required
                    value={itemTitle}
                    onChange={e => setItemTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Short details, booking voucher info, or timing reminders"
                    value={itemDesc}
                    onChange={e => setItemDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 10:30 AM"
                      value={itemTime}
                      onChange={e => setItemTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Cost (₹)</label>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="e.g. 1500"
                      value={itemPrice}
                      onChange={e => setItemPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Calangute Beach, Goa"
                    value={itemLocation}
                    onChange={e => setItemLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
