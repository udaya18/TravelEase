import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Plus, User as UserIcon, Loader2 } from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { bookingApi } from '../api/bookingApi';
import BookingCard from '../components/BookingCard';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Booking } from '../types/booking';

const filterTabs = [
  { id: 'all', label: 'All Bookings' },
  { id: 'flight', label: 'Flights' },
  { id: 'hotel', label: 'Hotels' },
  { id: 'cab', label: 'Cabs' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, cancelBooking } = useTravelStore();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchUserBookings = async () => {
    if (!isAuthenticated || !user?.userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await bookingApi.getUserBookings(user.userId);
      setActiveBookings(res);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setFetchError(err.response?.data?.message || err.message || 'Unable to load your bookings from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [isAuthenticated, user?.userId]);

  const filteredBookings = useMemo(() => {
    let result = [...activeBookings];

    if (activeTab === 'flight' || activeTab === 'hotel' || activeTab === 'cab') {
      result = result.filter((b) => b.bookingType === activeTab);
    } else if (activeTab === 'confirmed') {
      result = result.filter((b) => b.status === 'CONFIRMED');
    } else if (activeTab === 'cancelled') {
      result = result.filter((b) => b.status === 'CANCELLED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.bookingId.toLowerCase().includes(q) ||
          b.destination.toLowerCase().includes(q) ||
          b.summary.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeBookings, activeTab, searchQuery]);

  const handleConfirmCancel = async () => {
    if (cancelModalId) {
      const res = await bookingApi.cancelBooking(cancelModalId);
      if (res.success) {
        cancelBooking(cancelModalId);
        setActiveBookings((prev) =>
          prev.map((b) => (b.bookingId === cancelModalId ? { ...b, status: 'CANCELLED' as const, paymentStatus: 'REFUNDED' as const } : b))
        );
      } else {
        alert(res.message || 'Failed to cancel booking. Please try again.');
      }
      setCancelModalId(null);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <UserIcon size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In to View Bookings</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Please sign in to access your itinerary history, confirmed e-tickets, and live reservations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/signup')}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              Home
            </a>
            <span className="breadcrumb-sep">/</span>
            <span>My Bookings</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1>
                <BookOpen size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
                My Bookings & Trips
              </h1>
              <p>Manage, track schedules, view e-tickets, and process trip cancellations</p>
            </div>

            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <Plus size={16} /> New Reservation
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.375rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
              maxWidth: '100%',
            }}
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
              }}
            />
            <input
              className="form-control"
              placeholder="Search by ID or destination..."
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading and Error states */}
        {isLoading && <LoadingSpinner text="Loading your reservations from server..." />}

        {fetchError && !isLoading && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
            <p>{fetchError}</p>
            <button className="btn btn-outline" onClick={fetchUserBookings} style={{ marginTop: '0.75rem' }}>
              Retry
            </button>
          </div>
        )}

        {/* Bookings List */}
        {!isLoading && !fetchError && filteredBookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description={
              searchQuery
                ? `No reservations match "${searchQuery}". Try a different keyword.`
                : `You don't have any bookings in this category.`
            }
            action={
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Explore Trips
              </button>
            }
          />
        ) : !isLoading && !fetchError ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.bookingId}
                booking={booking}
                onCancel={(id) => setCancelModalId(id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cancelModalId}
        title="Cancel This Booking?"
        message="Are you sure you want to cancel this reservation? Inventory will be released and payment will be refunded."
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Booking"
        danger={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalId(null)}
      />
    </div>
  );
}
