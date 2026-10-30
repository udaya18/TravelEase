import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Filter, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { mockAlerts, type TravelAlert as TravelAlertType } from '../data/alerts';
import { useTravelStore } from '../store/travelStore';
import TravelAlert from '../components/TravelAlert';
import EmptyState from '../components/EmptyState';

const categoryTabs = [
  { id: 'all', label: 'All Alerts' },
  { id: 'important', label: 'Important' },
  { id: 'warning', label: 'Delays & Warnings' },
  { id: 'info', label: 'Reminders' },
  { id: 'success', label: 'Confirmations' },
];

export default function TravelAlerts() {
  const navigate = useNavigate();
  const { setUnreadAlertCount } = useTravelStore();

  const [alerts, setAlerts] = useState<TravelAlertType[]>(mockAlerts);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredAlerts = alerts.filter(a => {
    if (activeCategory === 'all') return true;
    return a.type === activeCategory;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const handleMarkAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    setUnreadAlertCount(0);
  };

  const handleMarkOneAsRead = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.alertId === alertId ? { ...a, isRead: true } : a))
    );
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <span>Travel Alerts</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>
                <Bell size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Travel Alerts & Advisory
              </h1>
              <p>Real-time travel reminders, terminal gates, flight delays, and itinerary updates</p>
            </div>

            {unreadCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={handleMarkAllAsRead}>
                <CheckCheck size={16} /> Mark All as Read ({unreadCount})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 780, paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
          {categoryTabs.map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeCategory === tab.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setActiveCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <EmptyState
            title="No Alerts in this Category"
            description="All your active travel schedules are on time and clear of disruptions."
            action={
              <button className="btn btn-outline" onClick={() => setActiveCategory('all')}>
                View All Alerts
              </button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredAlerts.map(alert => (
              <TravelAlert
                key={alert.alertId}
                alert={alert}
                onRead={handleMarkOneAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
