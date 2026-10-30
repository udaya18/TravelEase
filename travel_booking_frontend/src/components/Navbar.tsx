import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Plane, Hotel, Car, MapPin, Bell, User, LogOut, Settings, BookOpen, ChevronDown, Menu, X, Home, Compass } from 'lucide-react';
import { useTravelStore, demoLogin } from '../store/travelStore';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/hotels', label: 'Hotels', icon: Hotel },
  { to: '/cabs', label: 'Cabs', icon: Car },
  { to: '/itinerary', label: 'Itinerary', icon: Compass },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
];

export default function Navbar() {
  const { isAuthenticated, user, logout, unreadAlertCount, selectedFlight, selectedHotel, selectedCab } = useTravelStore();
  const selectedCount = (selectedFlight ? 1 : 0) + (selectedHotel ? 1 : 0) + (selectedCab ? 1 : 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const handleDemoLogin = async () => {
    await demoLogin();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            ✈ TravelEase
          </Link>

          {/* Desktop Nav */}
          <ul className="navbar-nav">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => isActive && to !== '/' ? 'active' : to === '/' ? '' : ''}
                  end={to === '/'}
                >
                  <Icon size={15} />
                  {label}
                  {to === '/itinerary' && selectedCount > 0 && (
                    <span
                      style={{
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '999px',
                        marginLeft: '0.35rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                {/* Alert Bell */}
                <div className="alert-badge-wrapper">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/alerts')}
                    aria-label="Travel Alerts"
                    style={{ padding: '0.5rem' }}
                  >
                    <Bell size={18} />
                  </button>
                  {unreadAlertCount > 0 && (
                    <span className="alert-badge-dot" aria-label={`${unreadAlertCount} unread alerts`}>
                      {unreadAlertCount}
                    </span>
                  )}
                </div>

                {/* User Menu */}
                <div className="user-menu" ref={userMenuRef}>
                  <button
                    className="user-avatar-btn"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} />
                    ) : (
                      <User size={20} />
                    )}
                    <span className="user-name-text">{user?.fullName?.split(' ')[0]}</span>
                    <ChevronDown size={14} style={{ color: 'var(--gray-400)', paddingRight: '4px' }} />
                  </button>

                  {userMenuOpen && (
                    <div className="dropdown-menu" role="menu">
                      <div style={{ padding: '1rem', borderBottom: '1px solid var(--gray-100)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.9rem' }}>{user?.fullName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{user?.email}</div>
                      </div>
                      <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <User size={16} /> My Profile
                      </Link>
                      <Link to="/bookings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <BookOpen size={16} /> My Bookings
                      </Link>
                      <Link to="/itinerary" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <Compass size={16} /> My Itinerary
                        {selectedCount > 0 && (
                          <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>{selectedCount}</span>
                        )}
                      </Link>
                      <Link to="/alerts" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <Bell size={16} /> Travel Alerts
                        {unreadAlertCount > 0 && (
                          <span className="badge badge-error" style={{ marginLeft: 'auto' }}>{unreadAlertCount}</span>
                        )}
                      </Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}

            {/* Hamburger */}
            <button
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-menu-nav">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  end={to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                  {to === '/itinerary' && selectedCount > 0 && (
                    <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                      {selectedCount} selected
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
            {isAuthenticated && (
              <>
                <li>
                  <NavLink to="/alerts" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                    <Bell size={18} /> Travel Alerts {unreadAlertCount > 0 && `(${unreadAlertCount})`}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
                    <Settings size={18} /> Profile
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <div className="mobile-menu-actions">
            {isAuthenticated ? (
              <button className="btn btn-danger btn-full" onClick={() => { logout(); setMobileMenuOpen(false); navigate('/login'); }}>
                <LogOut size={16} /> Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-full" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="btn btn-primary btn-full" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                <button className="btn btn-secondary btn-full" onClick={handleDemoLogin}>
                  Demo Login (No Signup Needed)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
