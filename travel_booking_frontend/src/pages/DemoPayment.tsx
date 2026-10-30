import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCard, Smartphone, Building, ShieldCheck, AlertCircle,
  CheckCircle2, XCircle, ArrowLeft, RefreshCw, Printer, Download,
  Loader2, Lock, Sparkles, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { useTravelStore } from '../store/travelStore';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import type { Booking } from '../types/booking';
import EmptyState from '../components/EmptyState';

type PaymentScreen = 'SELECTION' | 'PROCESSING' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';

// Helper to dynamically load the Razorpay Checkout.js script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout.js SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function DemoPayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, bookings, updateBooking } = useTravelStore();

  const [booking, setBooking] = useState<Booking | null>(() => {
    return bookings.find(b => b.bookingId === id || b.bookingReference === id) || null;
  });
  const [loading, setLoading] = useState(!booking);
  const [screen, setScreen] = useState<PaymentScreen>('SELECTION');
  const [isProcessing, setIsProcessing] = useState(false);

  // Razorpay and Transaction Details State
  const [transactionRef, setTransactionRef] = useState('');
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingStep, setProcessingStep] = useState('');

  // Fallback Simulation Drawer Toggle
  const [showSimulatedDrawer, setShowSimulatedDrawer] = useState(false);
  const [simulatedOutcome, setSimulatedOutcome] = useState<'SUCCESS' | 'FAILURE' | 'CANCELLED'>('SUCCESS');

  // Fetch Booking Details if not found in client store
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchBooking = async () => {
      try {
        const found = await bookingApi.getBookingById(id);
        if (isMounted && found) {
          setBooking(found);
          if (found.status === 'CONFIRMED' && (found.paymentStatus === 'PAID' || found.paymentStatus === 'DEMO_PAID')) {
            setTransactionRef(found.transactionReference || `RZP-TXN-${found.bookingId}`);
            setScreen('SUCCESS');
          }
        }
      } catch (err) {
        console.error('Error fetching booking for payment:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchBooking();
    return () => { isMounted = false; };
  }, [id]);

  if (!isAuthenticated || !user) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="card" style={{ padding: '2.5rem' }}>
            <Lock size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sign In Required</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Please sign in to access checkout and complete your travel payment securely.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Sign In to Proceed
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--gray-600)' }}>Initializing Razorpay Payment Gateway session...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="page-wrapper" style={{ padding: '4rem 1rem' }}>
        <div className="container">
          <EmptyState
            title="Booking Not Found"
            description="We could not find the booking details for this payment session."
            action={<button className="btn btn-primary" onClick={() => navigate('/bookings')}>Go to My Bookings</button>}
          />
        </div>
      </div>
    );
  }

  const rawBookingId = Number(booking.bookingId.replace('TE-', ''));
  const totalAmount = booking.priceBreakdown?.total || 0;

  // ───────────────────────────────────────────────────────────────────────────
  // RAZORPAY STANDARD CHECKOUT POPUP HANDLER
  // ───────────────────────────────────────────────────────────────────────────
  const handlePayWithRazorpay = async () => {
    setErrorMessage('');
    setIsProcessing(true);

    try {
      // Step 1: Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        throw new Error('Unable to load Razorpay Checkout script. Please check your network connection.');
      }

      // Step 2: Request server to create Razorpay Order in Test Mode
      const order = await paymentApi.createRazorpayOrder(rawBookingId);
      setRazorpayOrderId(order.orderId);

      // Determine public Razorpay Test Key ID
      const rzpKeyId = (order.keyId && !order.keyId.includes('placeholder'))
        ? order.keyId
        : (import.meta.env.VITE_RAZORPAY_KEY_ID && !import.meta.env.VITE_RAZORPAY_KEY_ID.includes('placeholder')
            ? import.meta.env.VITE_RAZORPAY_KEY_ID
            : null);

      if (!rzpKeyId) {
        setShowSimulatedDrawer(true);
        throw new Error('Razorpay Test Key ID is not configured yet. Please configure VITE_RAZORPAY_KEY_ID in your frontend .env or RAZORPAY_KEY_ID on the backend. You can also use the Developer Sandbox below to simulate any payment outcome instantly.');
      }

      // Step 3: Configure Razorpay Standard Checkout Options
      const options: any = {
        key: rzpKeyId,
        amount: order.amount, // in paise
        currency: order.currency || 'INR',
        name: 'TravelEase',
        description: order.description || `Booking #${booking.bookingReference || booking.bookingId}`,
        image: 'https://cdn-icons-png.flaticon.com/512/201/201623.png',
        order_id: order.orderId,
        prefill: {
          name: order.customerName || user?.fullName || 'Traveler',
          email: order.customerEmail || user?.email || '',
          contact: order.customerPhone || '9876543210',
        },
        notes: {
          bookingId: String(order.bookingId),
          bookingReference: order.bookingReference,
        },
        theme: {
          color: '#0d9488', // TravelEase Teal
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setScreen('CANCELLED');
            setErrorMessage('Payment was dismissed before completing authorization. You can retry anytime.');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Step 4: Server-Side Signature Verification
          try {
            setScreen('PROCESSING');
            setProcessingStep('Verifying Razorpay payment signature securely on server...');

            const verifyResult = await paymentApi.verifyRazorpayPayment({
              bookingId: rawBookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setTransactionRef(response.razorpay_payment_id);
            setRazorpayOrderId(response.razorpay_order_id);
            setResultMessage(verifyResult.message || 'Razorpay payment verified successfully.');

            // Update local & persistent application store
            setBooking(prev => prev ? {
              ...prev,
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              paymentMethod: 'RAZORPAY',
              transactionReference: response.razorpay_payment_id,
            } : null);

            updateBooking(booking.bookingId, {
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              paymentMethod: 'RAZORPAY',
              transactionReference: response.razorpay_payment_id,
            });

            setScreen('SUCCESS');
          } catch (err: any) {
            console.error('Signature verification error:', err);
            const msg = err.response?.data?.message || err.message || 'Payment signature verification failed.';
            setErrorMessage(msg);
            setScreen('FAILURE');
          } finally {
            setIsProcessing(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', (failResp: any) => {
        console.error('Razorpay payment failed:', failResp.error);
        setErrorMessage(failResp.error?.description || 'Razorpay payment failed or was declined.');
        setTransactionRef(failResp.error?.metadata?.payment_id || '');
        setScreen('FAILURE');
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Razorpay checkout initiation error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to initiate Razorpay Checkout session.';
      setErrorMessage(msg);
      setScreen('FAILURE');
      setIsProcessing(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // OPTIONAL FALLBACK SIMULATION (For offline development or quick sandbox tests)
  // ───────────────────────────────────────────────────────────────────────────
  const handleFallbackSimulation = async () => {
    setErrorMessage('');
    setIsProcessing(true);
    setScreen('PROCESSING');
    setProcessingStep('Initializing simulated payment transaction...');

    try {
      const initResp = await paymentApi.initiatePayment({
        bookingId: rawBookingId,
        paymentMethod: 'DEMO',
        amount: totalAmount,
        simulatedProvider: 'TravelEase Simulation Sandbox',
      });

      const txRef = initResp.transactionReference;
      setTransactionRef(txRef);

      setProcessingStep('Recording transactional ledger in database...');
      await new Promise(r => setTimeout(r, 600));

      const processResp = await paymentApi.processPayment({
        transactionReference: txRef,
        bookingId: rawBookingId,
        outcome: simulatedOutcome,
        failureReason: simulatedOutcome === 'FAILURE' ? 'Simulated card decline' : undefined,
      });

      if (processResp.paymentStatus === 'DEMO_PAID') {
        setBooking(prev => prev ? {
          ...prev,
          status: 'CONFIRMED',
          paymentStatus: 'DEMO_PAID',
          paymentMethod: 'DEMO',
          transactionReference: txRef,
        } : null);

        updateBooking(booking.bookingId, {
          status: 'CONFIRMED',
          paymentStatus: 'DEMO_PAID',
          paymentMethod: 'DEMO',
          transactionReference: txRef,
        });

        setScreen('SUCCESS');
      } else if (processResp.paymentStatus === 'FAILED') {
        setErrorMessage('Simulated card decline: insufficient funds');
        setScreen('FAILURE');
      } else {
        setScreen('CANCELLED');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Simulation error';
      setErrorMessage(msg);
      setScreen('FAILURE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const textData = `
===================================================
TRAVELEASE BOOKING RECEIPT & CONFIRMATION
===================================================
RAZORPAY TEST MODE - NO REAL MONEY CHARGED
===================================================
Razorpay Payment ID: ${transactionRef || 'N/A'}
Razorpay Order ID: ${razorpayOrderId || 'N/A'}
Booking Reference: ${booking.bookingReference || booking.bookingId}
Booking Status: CONFIRMED
Payment Status: ${booking.paymentStatus || 'PAID'}
Payment Gateway: Razorpay Standard Checkout
Amount Paid: Rs. ${totalAmount.toLocaleString('en-IN')}
Date & Time: ${new Date().toLocaleString()}

TRAVELLER DETAILS:
${booking.travellers?.map((t, i) => `${i + 1}. ${t.firstName} ${t.lastName} (${t.gender}, ${t.type})`).join('\n')}

TRIP ITINERARY:
${booking.summary}
Travel Date: ${booking.travelDate}

CONTACT:
Email: ${booking.contactDetails?.email || user.email}
Phone: ${booking.contactDetails?.phone || '9876543210'}
===================================================
Thank you for booking with TravelEase!
24x7 Customer Helpline: 1800-123-TRAVEL
===================================================
`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travelease-receipt-${booking.bookingReference || booking.bookingId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this reservation and release inventory?')) {
      await bookingApi.cancelBooking(booking.bookingId);
      navigate('/bookings');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 1: PROCESSING / VERIFYING SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'PROCESSING') {
    return (
      <div className="page-wrapper" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 520 }}>
          <div className="card" style={{ padding: '3rem 2rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 1.5rem auto' }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '4px solid var(--primary-light)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%'
              }}>
                <Lock size={28} style={{ color: 'var(--primary)' }} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Processing Payment
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '1.25rem' }}>
              {processingStep || 'Verifying transaction with server-side HMAC-SHA256 signature...'}
            </p>

            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: '0.8rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <ShieldCheck size={16} />
              <span><strong>RAZORPAY TEST MODE</strong> – No real money is charged.</span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
              Please do not close or refresh this tab while verification completes.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: SUCCESS SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'SUCCESS') {
    return (
      <div className="page-wrapper" style={{ paddingBottom: '4rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            padding: '3rem 1rem',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: 640 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Payment Successful!
            </h1>
            <p style={{ fontSize: '1rem', color: '#e6fffa', marginBottom: '0.5rem' }}>
              Your reservation is confirmed via Razorpay Standard Checkout.
            </p>
            <div style={{
              display: 'inline-block',
              background: '#fff',
              color: '#065f46',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              RAZORPAY TEST MODE – No real money charged
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 640, marginTop: '-2rem' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-xl)', padding: '2rem' }}>
            {/* Receipt Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Razorpay Payment ID</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)', fontFamily: 'monospace' }}>{transactionRef || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Razorpay Order ID</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'monospace' }}>{razorpayOrderId || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Reference</div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{booking.bookingReference || booking.bookingId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Paid</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--success)' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Status</div>
                <span className="badge badge-success" style={{ fontWeight: 700 }}>CONFIRMED</span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Status</div>
                <span className="badge badge-success" style={{ fontWeight: 700 }}>PAID (Verified)</span>
              </div>
            </div>

            {/* Trip Brief */}
            <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Trip Summary:</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>{booking.summary}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                Travel Date: {booking.travelDate} · Primary Traveller: {booking.travellers?.[0]?.firstName} {booking.travellers?.[0]?.lastName}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ flex: 1, minWidth: 160 }} onClick={handleDownload}>
                <Download size={16} /> Download E-Ticket
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, minWidth: 140 }} onClick={handlePrint}>
                <Printer size={16} /> Print Confirmation
              </button>
              <button className="btn btn-outline" style={{ flex: 1, minWidth: 140 }} onClick={() => navigate('/bookings')}>
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3: FAILURE SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'FAILURE') {
    return (
      <div className="page-wrapper" style={{ paddingBottom: '4rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            padding: '3rem 1rem',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: 640 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <XCircle size={40} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Payment Failed
            </h1>
            <p style={{ fontSize: '1rem', color: '#fee2e2', marginBottom: '0.5rem' }}>
              The Razorpay payment was declined or could not be verified.
            </p>
            <div style={{
              display: 'inline-block',
              background: '#fff',
              color: '#991b1b',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              RAZORPAY TEST MODE – No real money is charged.
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 640, marginTop: '-2rem' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-xl)', padding: '2rem' }}>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.9rem' }}>Decline Reason:</div>
                <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {errorMessage || resultMessage || 'Transaction failed or authorization timed out.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Razorpay Order Ref</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>{razorpayOrderId || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Booking Reference</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{booking.bookingReference || booking.bookingId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Attempted Amount</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--error)' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Booking State</div>
                <span className="badge badge-warning">HELD / PENDING</span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              Your reserved travel inventory is held. You can retry payment immediately with Razorpay Checkout or test credentials.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, minWidth: 180 }}
                onClick={() => {
                  setScreen('SELECTION');
                  handlePayWithRazorpay();
                }}
              >
                <RefreshCw size={16} /> Retry Payment
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, minWidth: 140 }}
                onClick={handleCancelBooking}
              >
                Cancel Booking
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1, minWidth: 140 }}
                onClick={() => navigate('/bookings')}
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 4: CANCELLED SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'CANCELLED') {
    return (
      <div className="page-wrapper" style={{ paddingBottom: '4rem' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            padding: '3rem 1rem',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: 640 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={40} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Payment Cancelled
            </h1>
            <p style={{ fontSize: '1rem', color: '#fef3c7', marginBottom: '0.5rem' }}>
              The Razorpay checkout was closed without completing the payment.
            </p>
            <div style={{
              display: 'inline-block',
              background: '#fff',
              color: '#92400e',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              RAZORPAY TEST MODE – No real money is charged.
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 640, marginTop: '-2rem' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-xl)', padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Razorpay Order Ref</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>{razorpayOrderId || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Booking Reference</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{booking.bookingReference || booking.bookingId}</div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              No funds were transferred. Your reservation remains available if you wish to resume or retry payment.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, minWidth: 180 }}
                onClick={() => {
                  setScreen('SELECTION');
                  handlePayWithRazorpay();
                }}
              >
                <RefreshCw size={16} /> Resume / Pay with Razorpay
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, minWidth: 140 }}
                onClick={handleCancelBooking}
              >
                Cancel Booking
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1, minWidth: 140 }}
                onClick={() => navigate('/bookings')}
              >
                My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 5: MAIN CHECKOUT & RAZORPAY PAYMENT TRIGGER SCREEN
  // ───────────────────────────────────────────────────────────────────────────
  const firstTraveller = booking.travellers?.[0];

  return (
    <div className="page-wrapper" style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div className="page-header" style={{ padding: '1.25rem 0' }}>
        <div className="container">
          <div className="breadcrumb" style={{ margin: 0 }}>
            <a onClick={() => navigate('/bookings')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowLeft size={16} /> Back to Bookings
            </a>
            <span className="breadcrumb-sep">/</span>
            <span>Razorpay Standard Checkout</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>TravelEase Razorpay Checkout</h1>
          <p>Official Razorpay Standard Checkout in TEST MODE — secure, frictionless, and compliant</p>

          {/* Test Mode Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.85rem 1.15rem',
            background: '#eff6ff',
            color: '#1e40af',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #bfdbfe',
            marginTop: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <ShieldCheck size={20} style={{ flexShrink: 0, color: '#2563eb' }} />
            <span>
              <strong>RAZORPAY TEST MODE – No real money is charged.</strong> Standard Checkout popup will open with Razorpay test environment.
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>

          {/* Left Column: Booking Details & Razorpay Information */}
          <div>
            {/* Trip & Traveller Summary Card */}
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-primary">Booking Ref: {booking.bookingReference || booking.bookingId}</span>
                    <span className="badge badge-warning">{booking.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Travel Date: <strong>{booking.travelDate}</strong>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                  {booking.summary}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-600)', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <strong>Primary Guest:</strong> {firstTraveller ? `${firstTraveller.firstName} ${firstTraveller.lastName}` : 'Guest Traveler'}
                  </div>
                  <div>
                    <strong>Email:</strong> {booking.contactDetails?.email || user.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {booking.contactDetails?.phone || '9876543210'}
                  </div>
                </div>
              </div>
            </div>

            {/* Razorpay Standard Checkout Showcase Card */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                  <CreditCard size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Razorpay Standard Checkout</h3>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '1.25rem' }}>
                  Clicking <strong>Pay Now</strong> opens the official Razorpay Checkout popup modal. Razorpay securely accepts:
                </p>

                {/* Supported Payment Channels Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', background: 'var(--gray-50)' }}>
                    <CreditCard size={22} style={{ color: 'var(--primary)', margin: '0 auto 0.35rem auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cards</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Visa, MC, RuPay</div>
                  </div>
                  <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', background: 'var(--gray-50)' }}>
                    <Smartphone size={22} style={{ color: 'var(--primary)', margin: '0 auto 0.35rem auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>UPI</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>GPay, PhonePe, QR</div>
                  </div>
                  <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', background: 'var(--gray-50)' }}>
                    <Building size={22} style={{ color: 'var(--primary)', margin: '0 auto 0.35rem auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Net Banking</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>50+ Indian Banks</div>
                  </div>
                  <div style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', background: 'var(--gray-50)' }}>
                    <Sparkles size={22} style={{ color: 'var(--primary)', margin: '0 auto 0.35rem auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Wallets</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Paytm, Amazon Pay</div>
                  </div>
                </div>

                {/* Test Mode Quick Reference Helper Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                    <ShieldCheck size={16} color="#0d9488" />
                    Razorpay Test Mode Helper & Mock Credentials:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                    <li><strong>Test Card:</strong> <code>4111 1111 1111 1111</code> · Expiry: Any future date · CVV: <code>123</code> · OTP: <code>1234</code></li>
                    <li><strong>Test UPI:</strong> <code>success@razorpay</code> or select any UPI simulation app</li>
                    <li><strong>Net Banking:</strong> Choose any bank (e.g. HDFC, SBI) and click "Success" in the Razorpay bank simulator</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Optional Fallback Drawer for Local Offline Simulation */}
            <div className="card" style={{ marginBottom: '1.5rem', background: '#fafafa', border: '1px dashed #cbd5e1' }}>
              <div
                className="card-body"
                style={{ padding: '0.85rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setShowSimulatedDrawer(!showSimulatedDrawer)}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Developer Sandbox: Local Simulation Options</span>
                </div>
                {showSimulatedDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {showSimulatedDrawer && (
                <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                    If you are testing offline without internet access or without a live Razorpay popup, you can trigger direct backend simulation:
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {(['SUCCESS', 'FAILURE', 'CANCELLED'] as const).map(out => (
                      <button
                        key={out}
                        type="button"
                        className={`btn btn-sm ${simulatedOutcome === out ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setSimulatedOutcome(out)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {out}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleFallbackSimulation}
                    disabled={isProcessing}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Run Local Simulation ({simulatedOutcome})
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Fare Breakdown & Pay CTA */}
          <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
            <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="card-body">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                  Payment Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Base Fare</span>
                    <span>₹{(booking.priceBreakdown?.baseFare || totalAmount).toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Taxes & GST</span>
                    <span>₹{(booking.priceBreakdown?.taxes || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>Convenience Fee</span>
                    <span>₹{booking.priceBreakdown?.convenienceFee || 0}</span>
                  </div>

                  {(booking.priceBreakdown?.discount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600 }}>
                      <span>Promo Discount</span>
                      <span>− ₹{booking.priceBreakdown.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                    <span>Total Payable</span>
                    <span style={{ color: 'var(--primary)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {errorMessage && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    color: '#b91c1c',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Primary Razorpay Pay Now Button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePayWithRazorpay}
                  disabled={isProcessing}
                  style={{ width: '100%', height: 48, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Initializing Razorpay...
                    </>
                  ) : (
                    <>
                      <Lock size={18} /> Pay ₹{totalAmount.toLocaleString('en-IN')}
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                  Secured by Razorpay · 256-bit SSL encryption
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
