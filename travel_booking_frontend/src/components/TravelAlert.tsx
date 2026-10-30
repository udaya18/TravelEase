import { ExternalLink } from 'lucide-react';
import type { TravelAlert } from '../data/alerts';
import { useTravelStore } from '../store/travelStore';

interface TravelAlertProps {
  alert: TravelAlert;
  onRead?: (id: string) => void;
}

const alertTypeLabel: Record<string, string> = {
  info: 'Info',
  warning: 'Warning',
  success: 'Success',
  important: 'Important',
};

const alertIcons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  important: '🚨',
};

export default function TravelAlert({ alert, onRead }: TravelAlertProps) {
  const decrementAlertCount = useTravelStore((s) => s.decrementAlertCount);

  const handleRead = () => {
    if (!alert.isRead) {
      decrementAlertCount();
      onRead?.(alert.alertId);
    }
  };

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div
      className={`alert-card ${alert.type} ${!alert.isRead ? 'unread' : ''}`}
      onClick={handleRead}
      style={{ cursor: !alert.isRead ? 'pointer' : 'default' }}
      role="article"
      aria-label={`${alertTypeLabel[alert.type]} alert: ${alert.title}`}
    >
      <div className="alert-icon-wrapper" aria-hidden="true">
        <span style={{ fontSize: '1rem' }}>{alertIcons[alert.type]}</span>
      </div>
      <div className="alert-content">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div className="alert-title">{alert.title}</div>
          {!alert.isRead && (
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: 'var(--primary)', flexShrink: 0, marginTop: '4px'
            }} aria-label="Unread" />
          )}
        </div>
        <p className="alert-message">{alert.message}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div className="alert-time">{formatTime(alert.time)}</div>
          {alert.actionLabel && (
            <a
              href={alert.actionUrl || '#'}
              className="btn btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.25rem 0.625rem', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 'var(--radius-sm)', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              {alert.actionLabel} <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
