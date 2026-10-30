import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const spinnerSize = size === 'sm' ? 20 : size === 'lg' ? 56 : 36;
  return (
    <div className="loading-container">
      <div style={{ color: 'var(--primary)', animation: 'spin 0.7s linear infinite' }}>
        <Loader2 size={spinnerSize} />
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
}
