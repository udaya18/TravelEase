import React from 'react';
import { X, ShieldCheck, AlertTriangle, Clock, Zap, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import type { RiskScoreDetails } from '../api/riskApi';

interface RiskInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  riskDetails: RiskScoreDetails | null;
}

export default function RiskInsightsModal({
  isOpen,
  onClose,
  title = 'Rule-Based Travel Risk Assessment',
  subtitle,
  riskDetails,
}: RiskInsightsModalProps) {
  if (!isOpen || !riskDetails) return null;

  const {
    riskScore,
    riskLevel,
    disruptionRisk,
    transferRisk,
    punctualityScore,
    priceScore,
    durationScore,
    recommendationScore,
    explanations = [],
    telemetry = {},
  } = riskDetails;

  const isLow = riskLevel === 'LOW';
  const isMed = riskLevel === 'MEDIUM';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '1rem',
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--gray-200)',
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: isLow ? '#059669' : isMed ? '#d97706' : '#dc2626', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <ShieldCheck size={16} /> Rule-Based Travel Risk Assessment
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--gray-900)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-600)' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: '50%', padding: '0.4rem', color: 'var(--gray-500)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Big Score Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: isLow ? '#ecfdf5' : isMed ? '#fffbeb' : '#fef2f2', padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${isLow ? '#a7f3d0' : isMed ? '#fde68a' : '#fecaca'}` }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 600 }}>Overall Risk</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: isLow ? '#065f46' : isMed ? '#92400e' : '#991b1b', margin: '0.25rem 0' }}>
              {riskScore.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLow ? '#059669' : isMed ? '#d97706' : '#dc2626' }}>
              {riskLevel} RISK
            </div>
          </div>

          <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 600 }}>Punctuality Expectation</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e40af', margin: '0.25rem 0' }}>
              {punctualityScore ? punctualityScore.toFixed(1) : (100 - disruptionRisk).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>On-Time Reliability</div>
          </div>

          <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 600 }}>Recommendation</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', margin: '0.25rem 0' }}>
              {recommendationScore.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Composite Score / 100</div>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid var(--gray-200)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={15} style={{ color: 'var(--primary)' }} /> Multi-Factor Vulnerability Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Disruption / Delay Vulnerability</span>
                <span style={{ fontWeight: 700, color: disruptionRisk > 40 ? 'var(--error)' : 'var(--gray-700)' }}>
                  {disruptionRisk.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, disruptionRisk)}%`, height: '100%', background: disruptionRisk > 50 ? 'var(--error)' : disruptionRisk > 25 ? 'var(--warning)' : 'var(--success)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Connection / Transfer Hazard</span>
                <span style={{ fontWeight: 700, color: transferRisk > 40 ? 'var(--error)' : 'var(--gray-700)' }}>
                  {transferRisk.toFixed(1)}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, transferRisk)}%`, height: '100%', background: transferRisk > 50 ? 'var(--error)' : transferRisk > 20 ? 'var(--warning)' : 'var(--success)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--gray-900)' }}>
            Rule-Based Assessment Explanations:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--gray-700)' }}>
            {explanations.map((exp, idx) => (
              <li key={idx} style={{ lineHeight: 1.5 }}>
                {exp}
              </li>
            ))}
          </ul>
        </div>

        {/* Telemetry pill row */}
        {telemetry && Object.keys(telemetry).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-200)' }}>
            {telemetry.assessmentMethod && (
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                Method: {String(telemetry.assessmentMethod)}
              </span>
            )}
            {telemetry.isPeakHour !== undefined && (
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                {telemetry.isPeakHour ? '⚠ Peak Departure Window' : '✓ Off-Peak Departure'}
              </span>
            )}
            {telemetry.stops !== undefined && (
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                {telemetry.stops === 0 ? '✓ Direct Non-Stop' : `${telemetry.stops} Stop(s)`}
              </span>
            )}
            {telemetry.availableSeats !== undefined && (
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                Available Seats: {Number(telemetry.availableSeats)}
              </span>
            )}
            {telemetry.airlineOnTimeRate !== undefined && (
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                Carrier On-Time Baseline: {Number(telemetry.airlineOnTimeRate).toFixed(0)}%
              </span>
            )}
          </div>
        )}

        {/* Footer Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
