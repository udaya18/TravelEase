import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { RiskLevel } from '../api/riskApi';

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  recommendationScore?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskBadge({ level, score, recommendationScore, onClick, size = 'sm' }: RiskBadgeProps) {
  let bgColor = '#ecfdf5';
  let textColor = '#065f46';
  let borderColor = '#a7f3d0';
  let Icon = ShieldCheck;
  let label = 'Low Risk';

  if (level === 'MEDIUM') {
    bgColor = '#fffbeb';
    textColor = '#92400e';
    borderColor = '#fde68a';
    Icon = AlertTriangle;
    label = 'Moderate Risk';
  } else if (level === 'HIGH') {
    bgColor = '#fef2f2';
    textColor = '#991b1b';
    borderColor = '#fecaca';
    Icon = ShieldAlert;
    label = 'High Risk';
  }

  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: size === 'sm' ? '0.2rem 0.55rem' : size === 'lg' ? '0.5rem 1rem' : '0.35rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '0.95rem' : '0.85rem',
        fontWeight: 600,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      title={isClickable ? 'Click to view rule-based risk breakdown & explanations' : undefined}
    >
      <Icon size={size === 'sm' ? 13 : 16} />
      <span>{label}</span>
      <span style={{ opacity: 0.8, fontSize: '0.85em', fontWeight: 500 }}>
        ({score.toFixed(1)}%)
      </span>
      {isClickable && (
        <span style={{ fontSize: '0.7em', textDecoration: 'underline', marginLeft: '0.2rem', opacity: 0.9 }}>
          Why?
        </span>
      )}
    </div>
  );
}
