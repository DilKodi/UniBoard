import axios from 'axios';

export interface BoardingPlaceResponse {
  id: number;
  owner_id: number;
  owner_full_name?: string | null;
  property_name: string;
  location: string;
  address: string;
  nearest_university: string;
  number_of_floors: number;
  number_of_rooms: number;
  verification_document_name?: string | null;
  rejection_reason?: string | null;
  status: string;
  created_at: string;
}

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getStoredToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('access_token');
};

// Add a request interceptor to attach the Token if it exists
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const loginUser = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  
  const response = await api.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const signupUser = async (
  email: string,
  password: string,
  role: string,
  fullName: string,
  additionalData?: Record<string, unknown>,
) => {
  const payload = {
    email,
    password,
    role,
    full_name: fullName,
    ...additionalData,
  };
  
  const response = await api.post('/signup', payload);
  return response.data;
};

export const createListing = async (payload: Record<string, unknown>) => {
  // payload should be JSON fields matching BoardingPlaceCreate
  const response = await api.post('/listings', payload);
  return response.data;
};

export const fetchListings = async () => {
  const response = await api.get<BoardingPlaceResponse[]>('/listings');
  return response.data;
};

export const fetchListingById = async (id: number) => {
  const response = await api.get<BoardingPlaceResponse>(`/listings/${id}`);
  return response.data;
};

export const fetchMyListings = async () => {
  const response = await api.get<BoardingPlaceResponse[]>('/listings/mine');
  return response.data;
};

export const fetchPendingListings = async () => {
  const response = await api.get<BoardingPlaceResponse[]>('/admin/listings/pending');
  return response.data;
};

export const approveListing = async (id: number) => {
  const response = await api.post<BoardingPlaceResponse>(`/admin/listings/${id}/approve`);
  return response.data;
};

export const rejectListing = async (id: number, rejectionReason?: string) => {
  const response = await api.post<BoardingPlaceResponse>(`/admin/listings/${id}/reject`, {
    rejection_reason: rejectionReason || null,
  });
  return response.data;
};

export const uploadDocument = async (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  const response = await api.post('/listings/upload', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchUserProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export default api;