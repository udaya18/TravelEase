import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Hotel, Car, Search } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import {
  AIRPORT_LOCATIONS,
  HOTEL_DESTINATIONS,
  CAB_PICKUP_LOCATIONS,
  CAB_DROP_LOCATIONS
} from '../data/travelLocations';

export default function Home() {
  const navigate = useNavigate();
  const { setFlightSearchParams, setHotelSearchParams, setCabSearchParams } = useTravelStore();
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cabs'>('flights');
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');

  // Flight search state
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [departure, setDeparture] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travellers, setTravellers] = useState('1');
  const [cabinClass, setCabinClass] = useState('Economy');

  // Hotel search state
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [rooms, setRooms] = useState('1');

  // Cab search state
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [cabDate, setCabDate] = useState('');
  const [cabTime, setCabTime] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFlightSearchParams({
      from: flightFrom,
      to: flightTo,
      departureDate: departure,
      returnDate,
      travellers: Number(travellers),
      cabinClass,
      tripType,
    });
    navigate('/flights');
  };

  const handleHotelSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHotelSearchParams({
      destination,
      checkIn,
      checkOut,
      guests: Number(guests),
      rooms: Number(rooms),
    });
    navigate('/hotels');
  };

  const handleCabSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCabSearchParams({
      pickup,
      drop,
      date: cabDate,
      time: cabTime,
    });
    navigate('/cabs');
  };

  return (
    <div className="home-page">
      {/* Simple Clean Hero Header */}
      <section className="hero">
        <div className="container">
          <div className="hero-text">
            <h1 className="hero-title">TravelEase</h1>
            <p className="hero-subtitle">
              Online Travel Booking Platform – Search and book flights, hotels, and cabs in one place.
            </p>
          </div>

          {/* Core Search Panel */}
          <div className="search-panel">
            <div className="search-tabs" role="tablist">
              {(['flights', 'hotels', 'cabs'] as const).map((tab) => {
                const icons = { flights: Plane, hotels: Hotel, cabs: Car };
                const labels = { flights: 'Flights', hotels: 'Hotels', cabs: 'Cabs' };
                const Icon = icons[tab];
                return (
                  <button
                    key={tab}
                    type="button"
                    className={`search-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    role="tab"
                    aria-selected={activeTab === tab}
                    id={`tab-${tab}`}
                  >
                    <Icon size={18} /> {labels[tab]}
                  </button>
                );
              })}
            </div>

            <div className="search-form">
              {/* FLIGHTS */}
              {activeTab === 'flights' && (
                <form onSubmit={handleFlightSearch}>
                  <div className="trip-type-toggle">
                    {(['one-way', 'round-trip'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`trip-type-btn ${tripType === type ? 'active' : ''}`}
                        onClick={() => setTripType(type)}
                      >
                        {type === 'one-way' ? 'One Way' : 'Round Trip'}
                      </button>
                    ))}
                  </div>
                  <div className="search-fields">
                    <div className="search-field">
                      <label className="search-field-label">From</label>
                      <input
                        className="search-input"
                        placeholder="City or Airport (e.g. Hyderabad)"
                        value={flightFrom}
                        onChange={(e) => setFlightFrom(e.target.value)}
                        list="cities-list"
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">To</label>
                      <input
                        className="search-input"
                        placeholder="City or Airport (e.g. Delhi)"
                        value={flightTo}
                        onChange={(e) => setFlightTo(e.target.value)}
                        list="cities-list"
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Departure Date</label>
                      <input
                        className="search-input"
                        type="date"
                        min={today}
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                      />
                    </div>
                    {tripType === 'round-trip' && (
                      <div className="search-field">
                        <label className="search-field-label">Return Date</label>
                        <input
                          className="search-input"
                          type="date"
                          min={departure || today}
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="search-field">
                      <label className="search-field-label">Travellers</label>
                      <select
                        className="search-input"
                        value={travellers}
                        onChange={(e) => setTravellers(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Adult' : 'Adults'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Class</label>
                      <select
                        className="search-input"
                        value={cabinClass}
                        onChange={(e) => setCabinClass(e.target.value)}
                      >
                        <option>Economy</option>
                        <option>Premium Economy</option>
                        <option>Business</option>
                        <option>First Class</option>
                      </select>
                    </div>
                  </div>
                  <div className="search-btn-wrapper">
                    <button type="submit" className="search-btn">
                      <Search size={18} /> Search Flights
                    </button>
                  </div>
                </form>
              )}

              {/* HOTELS */}
              {activeTab === 'hotels' && (
                <form onSubmit={handleHotelSearch}>
                  <div className="search-fields">
                    <div className="search-field">
                      <label className="search-field-label">Destination</label>
                      <input
                        className="search-input"
                        placeholder="City, area or hotel name (e.g. Hyderabad)"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        list="hotel-dest-list"
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Check-in Date</label>
                      <input
                        className="search-input"
                        type="date"
                        min={today}
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Check-out Date</label>
                      <input
                        className="search-input"
                        type="date"
                        min={checkIn || today}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Guests</label>
                      <select
                        className="search-input"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} Guest{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Rooms</label>
                      <select
                        className="search-input"
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n} Room{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="search-btn-wrapper">
                    <button type="submit" className="search-btn">
                      <Search size={18} /> Search Hotels
                    </button>
                  </div>
                </form>
              )}

              {/* CABS */}
              {activeTab === 'cabs' && (
                <form onSubmit={handleCabSearch}>
                  <div className="search-fields">
                    <div className="search-field">
                      <label className="search-field-label">Pickup Location</label>
                      <input
                        className="search-input"
                        placeholder="Pickup point (e.g. Hyderabad Airport)"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        list="cab-pickup-list"
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Drop Location</label>
                      <input
                        className="search-input"
                        placeholder="Destination (e.g. Hitech City)"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        list="cab-drop-list"
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Date</label>
                      <input
                        className="search-input"
                        type="date"
                        min={today}
                        value={cabDate}
                        onChange={(e) => setCabDate(e.target.value)}
                      />
                    </div>
                    <div className="search-field">
                      <label className="search-field-label">Time</label>
                      <input
                        className="search-input"
                        type="time"
                        value={cabTime}
                        onChange={(e) => setCabTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="search-btn-wrapper">
                    <button type="submit" className="search-btn">
                      <Search size={18} /> Search Cabs
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Datalists for autocomplete */}
        <datalist id="cities-list">
          {AIRPORT_LOCATIONS.map((a) => (
            <option key={a.code} value={a.label} />
          ))}
        </datalist>

        <datalist id="hotel-dest-list">
          {HOTEL_DESTINATIONS.map((d) => (
            <option key={d.city} value={d.label} />
          ))}
        </datalist>

        <datalist id="cab-pickup-list">
          {CAB_PICKUP_LOCATIONS.map((p) => (
            <option key={p.location} value={p.location} />
          ))}
        </datalist>

        <datalist id="cab-drop-list">
          {CAB_DROP_LOCATIONS.map((d) => (
            <option key={d.location} value={d.location} />
          ))}
        </datalist>
      </section>

    </div>
  );
}
