import axiosInstance from './axiosInstance';

export interface PaymentResponse {
  paymentId: number;
  transactionReference: string;
  bookingId: number;
  bookingReference: string;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string; // PENDING, DEMO_PAID, FAILED, CANCELLED, REFUNDED
  bookingStatus: string; // PENDING, CONFIRMED, CANCELLED
  failureReason?: string;
  isDemo: boolean;
  simulatedProvider?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  completedAt?: string;
  message?: string;
}

export interface PaymentInitiateRequest {
  bookingId: number;
  paymentMethod: string;
  amount: number;
  simulatedProvider?: string;
}

export interface PaymentProcessRequest {
  transactionReference: string;
  bookingId: number;
  outcome?: 'SUCCESS' | 'FAILURE' | 'CANCELLED';
  failureReason?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number; // in paise (e.g. 485000)
  currency: string;
  keyId: string;
  bookingId: number;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  notes?: string;
}

export interface RazorpayVerifyRequest {
  bookingId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const paymentApi = {
  // Create a Razorpay Order in Test Mode
  createRazorpayOrder: async (bookingId: number | string): Promise<RazorpayOrderResponse> => {
    const numId = typeof bookingId === 'string' ? Number(bookingId.replace('TE-', '')) : bookingId;
    const response = await axiosInstance.post<RazorpayOrderResponse>('/payments/create-order', {
      bookingId: numId,
    });
    return response.data;
  },

  // Verify Razorpay Payment Signature (Server-Side HMAC-SHA256)
  verifyRazorpayPayment: async (data: RazorpayVerifyRequest): Promise<PaymentResponse> => {
    const response = await axiosInstance.post<PaymentResponse>('/payments/verify', data);
    return response.data;
  },

  // Initiate a new demo payment attempt
  initiatePayment: async (data: PaymentInitiateRequest): Promise<PaymentResponse> => {
    const response = await axiosInstance.post<PaymentResponse>('/payments/initiate', data);
    return response.data;
  },

  // Process / simulate the outcome of the payment
  processPayment: async (data: PaymentProcessRequest): Promise<PaymentResponse> => {
    const response = await axiosInstance.post<PaymentResponse>('/payments/process', data);
    return response.data;
  },

  // Get transaction details by reference
  getPaymentByReference: async (transactionReference: string): Promise<PaymentResponse> => {
    const response = await axiosInstance.get<PaymentResponse>(`/payments/${transactionReference}`);
    return response.data;
  },

  // Get all payment attempts for a booking
  getPaymentsByBookingId: async (bookingId: number | string): Promise<PaymentResponse[]> => {
    const numId = typeof bookingId === 'string' ? Number(bookingId.replace('TE-', '')) : bookingId;
    const response = await axiosInstance.get<PaymentResponse[]>(`/payments/booking/${numId}`);
    return response.data;
  },
};

