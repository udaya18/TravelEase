
import axios from 'axios';

const API_BASE_URL = 'https://travelease-backend-6vtu.onrender.com/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
axiosInstance.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('travelease_token');

    if (!token) {
      try {
        const stored = localStorage.getItem('travel-ease-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.token) {
            token = parsed.state.token;
          }
        }
      } catch {
        // ignore
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Token Expiry
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint =
        url.includes('/auth/signin') ||
        url.includes('/auth/login') ||
        url.includes('/auth/signup');

      if (!isAuthEndpoint) {
        localStorage.removeItem('travelease_token');

        try {
          const stored = localStorage.getItem('travel-ease-storage');

          if (stored) {
            const parsed = JSON.parse(stored);

            if (parsed?.state) {
              parsed.state.user = null;
              parsed.state.token = null;
              parsed.state.isAuthenticated = false;

              localStorage.setItem(
                'travel-ease-storage',
                JSON.stringify(parsed)
              );
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
