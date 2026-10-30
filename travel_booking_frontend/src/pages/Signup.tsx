import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Phone, Lock, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { signupSchema, type SignupFormData } from '../schemas/signupSchema';
import { authApi } from '../api/authApi';
import { useTravelStore } from '../store/travelStore';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useTravelStore();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const response = await authApi.signup({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      login(response.user, response.token);
      navigate('/');
    } catch (err: any) {
      setAuthError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '2rem 1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)' }}>
        <div className="card-body" style={{ padding: '2.25rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Account</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
              Join TravelEase for exclusive discounts, seamless bookings, and automated travel alerts.
            </p>
          </div>

          {authError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <User size={14} /> Full Name
              </label>
              <input
                className="form-control"
                placeholder="e.g. Priya Sharma"
                {...register('fullName')}
              />
              {errors.fullName && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.fullName.message}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="priya@example.com"
                {...register('email')}
              />
              {errors.email && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.email.message}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Phone size={14} /> Mobile Phone (10 digits)
              </label>
              <input
                type="tel"
                maxLength={10}
                className="form-control"
                placeholder="9876543210"
                {...register('phone')}
              />
              {errors.phone && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.phone.message}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Lock size={14} /> Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Min. 8 characters with 1 capital and 1 number"
                {...register('password')}
              />
              {errors.password && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.password.message}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Lock size={14} /> Confirm Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Repeat password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.confirmPassword.message}
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
                  <Loader2 size={18} className="animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Register Now
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--gray-600)', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
