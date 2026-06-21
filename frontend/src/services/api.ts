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
  total_rooms?: number;
  verification_document_name?: string | null;
  verification_document_url?: string | null;
  rejection_reason?: string | null;
  gender_restriction?: string | null;
  status: string;
  created_at: string;
  price_range?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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

const mapListing = (item: any): BoardingPlaceResponse => ({
  ...item,
  number_of_rooms: item.number_of_rooms !== undefined && item.number_of_rooms !== null
    ? item.number_of_rooms
    : (item.total_rooms !== undefined && item.total_rooms !== null ? item.total_rooms : 0),
});

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
  const response = await api.get<any[]>('/listings');
  return response.data.map(mapListing);
};

export const fetchListingById = async (id: number) => {
  const response = await api.get<any>(`/listings/${id}`);
  return mapListing(response.data);
};

export const fetchMyListings = async () => {
  const response = await api.get<any[]>('/listings/mine');
  return response.data.map(mapListing);
};

export const fetchPendingListings = async () => {
  const response = await api.get<any[]>('/admin/listings/pending');
  return response.data.map(mapListing);
};

export const approveListing = async (id: number) => {
  const response = await api.post<any>(`/admin/listings/${id}/approve`);
  return mapListing(response.data);
};

export const rejectListing = async (id: number, rejectionReason?: string) => {
  const response = await api.post<any>(`/admin/listings/${id}/reject`, {
    rejection_reason: rejectionReason || null,
  });
  return mapListing(response.data);
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

export const uploadProfilePicture = async (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  const response = await api.post<{ url: string }>('/users/profile/upload', fd, {
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

export const fetchOwnerProfile = async (ownerId: number) => {
  const response = await api.get(`/owners/${ownerId}`);
  return response.data;
};

// Profile updates
export const updateStudentProfile = async (payload: Record<string, unknown>) => {
  const response = await api.put('/users/me/student', payload);
  return response.data;
};

export const updateOwnerProfile = async (payload: Record<string, unknown>) => {
  const response = await api.put('/users/me/owner', payload);
  return response.data;
};

// Rooms API
export const fetchRooms = async (propertyId: number) => {
  const response = await api.get(`/rooms/property/${propertyId}`);
  return response.data;
};

export const createRoom = async (propertyId: number, payload: Record<string, unknown>) => {
  const response = await api.post(`/rooms?property_id=${propertyId}`, payload);
  return response.data;
};

export const updateRoom = async (roomId: string | number, payload: Record<string, unknown>) => {
  const response = await api.put(`/rooms/${roomId}`, payload);
  return response.data;
};

export const toggleRoomStatus = async (roomId: string | number, isAvailable: boolean) => {
  const response = await api.patch(`/rooms/${roomId}/availability?is_available=${isAvailable}`);
  return response.data;
};

export const deleteRoom = async (roomId: string | number) => {
  await api.delete(`/rooms/${roomId}`);
};

// Bookings and Visits API
export const createVisitRequest = async (payload: Record<string, unknown>) => {
  const response = await api.post('/bookings/visit', payload);
  return response.data;
};

export const createBookingRequest = async (payload: Record<string, unknown>) => {
  const response = await api.post('/bookings/booking', payload);
  return response.data;
};

export const fetchPropertyVisits = async (propertyId: number) => {
  const response = await api.get(`/bookings/property/${propertyId}/visits`);
  return response.data;
};

export const fetchPropertyBookings = async (propertyId: number) => {
  const response = await api.get(`/bookings/property/${propertyId}/bookings`);
  return response.data;
};

export const fetchStudentBookings = async (studentId: number) => {
  const response = await api.get(`/bookings/student/${studentId}/bookings`);
  return response.data;
};

export const fetchStudentVisits = async (studentId: number) => {
  const response = await api.get(`/bookings/student/${studentId}/visits`);
  return response.data;
};

export const updateVisitRequestStatus = async (reqId: string | number, status: 'accepted' | 'declined') => {
  const response = await api.patch(`/bookings/visit/${reqId}`, { status });
  return response.data;
};

export const updateBookingRequestStatus = async (reqId: string | number, status: 'accepted' | 'declined') => {
  const response = await api.patch(`/bookings/booking/${reqId}`, { status });
  return response.data;
};

// Listing R2 Images API
export const fetchListingImages = async (propertyId: number) => {
  const response = await api.get(`/listings/${propertyId}/images`);
  return response.data;
};

export const uploadListingImage = async (propertyId: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  const response = await api.post(`/listings/${propertyId}/images`, fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteListingImage = async (propertyId: number, imageId: number) => {
  const response = await api.delete(`/listings/${propertyId}/images/${imageId}`);
  return response.data;
};

// Reviews API
export const fetchPropertyReviewsSummary = async (propertyId: number) => {
  const response = await api.get(`/reviews/property/${propertyId}/summary`);
  return response.data;
};

export const fetchPropertyReviews = async (propertyId: number, includeHidden: boolean = false) => {
  const response = await api.get(`/reviews/property/${propertyId}`, {
    params: { include_hidden: includeHidden }
  });
  return response.data;
};

export const createReview = async (payload: {
  property_id: number;
  booking_id?: number | null;
  visit_id?: number | null;
  rating: number;
  comment?: string | null;
}) => {
  const response = await api.post('/reviews', payload);
  return response.data;
};

export const uploadReviewMedia = async (reviewId: number, files: File[]) => {
  const fd = new FormData();
  files.forEach((file) => {
    fd.append('files', file);
  });
  const response = await api.post(`/reviews/${reviewId}/media`, fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const replyToReview = async (reviewId: number, reply: string) => {
  const response = await api.post(`/reviews/${reviewId}/reply`, { reply });
  return response.data;
};

export const toggleReviewVisibility = async (reviewId: number) => {
  const response = await api.patch(`/reviews/${reviewId}/visibility`);
  return response.data;
};

export const deleteReview = async (reviewId: number) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

// Notifications API
export interface NotificationResponse {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

export const fetchNotifications = async () => {
  const response = await api.get<NotificationResponse[]>('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await api.patch<NotificationResponse>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch<{ message: string }>('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: number) => {
  await api.delete(`/notifications/${id}`);
};

export default api;