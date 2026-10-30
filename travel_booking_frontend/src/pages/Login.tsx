import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/loginSchema';
import { authApi } from '../api/authApi';
import { useTravelStore } from '../store/travelStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useTravelStore();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const response = await authApi.login(data.email.trim(), data.password);
      login(response.user, response.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setAuthError('');
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)' }}>
        <div className="card-body" style={{ padding: '2.25rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Welcome Back</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
              Sign in to access your flight & hotel bookings, saved itineraries, and travel deals.
            </p>
          </div>

          {/* Quick Demo Credentials */}
          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Quick Fill Demo Accounts:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}
                onClick={() => fillCredentials('udayasri@email.com', 'password123')}
              >
                👤 Demo Traveler
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem' }}
                onClick={() => fillCredentials('admin@travelease.com', 'admin123')}
              >
                🛡️ Travel Admin
              </button>
            </div>
          </div>

          {authError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="name@example.com"
                {...register('email')}
              />
              {errors.email && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.email.message}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', margin: 0 }}>
                  <Lock size={14} /> Password
                </label>
                <a href="#forgot" style={{ fontSize: '0.75rem' }}>Forgot password?</a>
              </div>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.password.message}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ width: '100%', height: 44, fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ fontWeight: 700 }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
