import { useNavigate } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--primary-50)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <Compass size={44} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Lost in Exploration?</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          The page or itinerary you are looking for has been moved or does not exist. Let's get you back on track!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <Home size={16} /> Back to Home
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/flights')}>
            <Search size={16} /> Search Flights
          </button>
        </div>
      </div>
    </div>
  );
}
