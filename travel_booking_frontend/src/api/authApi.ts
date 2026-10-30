import axiosInstance from './axiosInstance';
import type { User } from '../types/user';

interface LoginResponse {
  token: string;
  user: User;
}

interface BackendAuthResponse {
  userId: number;
  name: string;       // backend field is 'name'
  email: string;
  role: 'USER' | 'ADMIN';
  token: string;
  message: string;
}

const mapAuthResponseToUser = (resp: BackendAuthResponse): User => ({
  userId: String(resp.userId),
  fullName: resp.name,  // backend sends 'name', map to frontend 'fullName'
  email: resp.email,
  phone: '',            // backend does not store phone; default empty
  role: resp.role || 'USER',
  avatar: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(resp.email)}&backgroundColor=b6e3f4`,
  preferences: {
    preferredAirline: 'IndiGo',
    preferredCabinClass: 'Economy',
    preferredHotelCategory: '4-Star',
    mealPreference: 'Vegetarian',
    seatPreference: 'Window',
    newsletterSubscribed: true,
  },
  savedTravellers: [],
  savedPaymentMethods: [],
  savedDestinations: [],
  createdAt: new Date().toISOString(),
});

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axiosInstance.post<BackendAuthResponse>('/auth/signin', { email, password });
    const data = response.data;
    const user = mapAuthResponseToUser(data);
    return {
      token: data.token,
      user,
    };
  },

  signup: async (data: { fullName: string; email: string; phone: string; password: string }): Promise<LoginResponse> => {
    const response = await axiosInstance.post<BackendAuthResponse>('/auth/signup', {
      name: data.fullName,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
    const resData = response.data;
    const user = mapAuthResponseToUser(resData);
    return {
      token: resData.token,
      user,
    };
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('travelease_token');
  },

  getProfile: async (): Promise<User | null> => {
    try {
      const response = await axiosInstance.get<BackendAuthResponse>('/users/me');
      return mapAuthResponseToUser(response.data);
    } catch {
      return null;
    }
  },
};
