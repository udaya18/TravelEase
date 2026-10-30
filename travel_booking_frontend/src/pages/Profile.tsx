import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Mail, Phone, Calendar, MapPin,
  Settings, LogOut, Shield, Heart, Plane, Hotel, Check, Sparkles
} from 'lucide-react';
import { useTravelStore, demoLogin } from '../store/travelStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, login } = useTravelStore();

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preference form state
  const [preferredAirline, setPreferredAirline] = useState(user?.preferences?.preferredAirline || 'IndiGo');
  const [preferredCabinClass, setPreferredCabinClass] = useState(user?.preferences?.preferredCabinClass || 'Economy');
  const [preferredHotelCategory, setPreferredHotelCategory] = useState(user?.preferences?.preferredHotelCategory || '4-Star');
  const [mealPreference, setMealPreference] = useState(user?.preferences?.mealPreference || 'Vegetarian');
  const [seatPreference, setSeatPreference] = useState(user?.preferences?.seatPreference || 'Window');

  if (!isAuthenticated || !user) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="card" style={{ padding: '2rem' }}>
            <UserIcon size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>You are not signed in</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Sign in to view your profile, manage saved travellers, and personalize travel preferences.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await demoLogin();
                }}
              >
                <Sparkles size={16} /> Sign in as Demo User (Udayasri)
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/login')}>
                Sign In with Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const currentToken = useTravelStore.getState().token || '';
      login(
        {
          ...user,
          preferences: {
            ...user.preferences,
            preferredAirline,
            preferredCabinClass,
            preferredHotelCategory,
            mealPreference,
            seatPreference,
          },
        },
        currentToken
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>User Profile</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'var(--primary-100)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  border: '3px solid #fff',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {user.fullName.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{user.fullName}</h1>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                  Member since {new Date(user.createdAt).getFullYear()} · Verified Traveler
                </p>
              </div>
            </div>

            <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ color: 'var(--error)' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 880, paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Contact Details Card */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
                Account Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Email Address</div>
                    <div style={{ fontWeight: 600 }}>{user.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={16} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Phone Number</div>
                    <div style={{ fontWeight: 600 }}>+91 {user.phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={16} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Account Status</div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>Verified & Protected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
                Quick Travel Tools
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/bookings')}>
                  <Calendar size={16} /> View Booking History
                </button>
                <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/itinerary')}>
                  <MapPin size={16} /> View Trip Itinerary
                </button>
                <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/alerts')}>
                  <Settings size={16} /> Travel Advisories & Alerts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Preferences Form */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Travel Preferences</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>
                  Customize your default seating, meal, cabin, and accommodation choices for rapid checkout
                </p>
              </div>
              {savedSuccess && (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check size={12} /> Preferences Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSavePreferences}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Preferred Airline</label>
                  <select
                    className="form-control"
                    value={preferredAirline}
                    onChange={e => setPreferredAirline(e.target.value)}
                  >
                    <option>IndiGo</option>
                    <option>Air India</option>
                    <option>Vistara</option>
                    <option>Akasa Air</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cabin Class</label>
                  <select
                    className="form-control"
                    value={preferredCabinClass}
                    onChange={e => setPreferredCabinClass(e.target.value)}
                  >
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Seat Preference</label>
                  <select
                    className="form-control"
                    value={seatPreference}
                    onChange={e => setSeatPreference(e.target.value)}
                  >
                    <option>Window</option>
                    <option>Aisle</option>
                    <option>Middle</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">In-Flight Meal</label>
                  <select
                    className="form-control"
                    value={mealPreference}
                    onChange={e => setMealPreference(e.target.value)}
                  >
                    <option>Vegetarian</option>
                    <option>Non-Vegetarian</option>
                    <option>Jain Meal</option>
                    <option>Diabetic Meal</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Hotel Rating</label>
                  <select
                    className="form-control"
                    value={preferredHotelCategory}
                    onChange={e => setPreferredHotelCategory(e.target.value)}
                  >
                    <option>5-Star Luxury</option>
                    <option>4-Star Premium</option>
                    <option>3-Star Comfort</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Saved Travellers Card */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Saved Co-Travellers</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              Family members and colleagues saved for one-click checkout.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>Priya Sharma</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Female · Born 22 Aug 1998 · Spouse</div>
                </div>
                <span className="badge badge-primary">Primary Co-traveler</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
