import axios from 'axios'

export interface BoardingPlaceResponse {
  id: number
  owner_id: number
  owner_full_name?: string | null
  property_name: string
  location: string
  address: string
  nearest_university: string
  number_of_floors: number
  number_of_rooms: number
  verification_document_name?: string | null
  rejection_reason?: string | null
  status: string
  created_at: string
}

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8001'
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'admin_token'

const createClient = (baseURL: string) => axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const attachToken = (config: any) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

const authApi = createClient(AUTH_API_URL)
const adminApi = createClient(ADMIN_API_URL)

authApi.interceptors.request.use(attachToken)
adminApi.interceptors.request.use(attachToken)

const handleUnauthorized = (error: any) => {
  const isLoginRequest = error.config?.url?.includes('/login') || window.location.pathname === '/login'

  if (error.response?.status === 401 && !isLoginRequest) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('admin_role')
    window.location.href = '/login'
  }
  return Promise.reject(error)
}

authApi.interceptors.response.use(
  (response) => response,
  handleUnauthorized,
)

adminApi.interceptors.response.use(
  (response) => response,
  handleUnauthorized,
)

export const loginUser = async (email: string, password: string) => {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await authApi.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  return response.data as { access_token: string; token_type: string; role?: string }
}

export const fetchUserProfile = async () => {
  const response = await authApi.get('/users/me')
  return response.data as { id: number; email: string; role: 'student' | 'owner' | 'admin'; is_active: boolean; is_verified: boolean }
}

export const fetchPendingListings = async () => {
  const response = await adminApi.get<BoardingPlaceResponse[]>('/admin/listings/pending')
  return response.data
}

export const approveListing = async (id: number) => {
  const response = await adminApi.post<BoardingPlaceResponse>(`/admin/listings/${id}/approve`)
  return response.data
}

export const rejectListing = async (id: number, rejectionReason?: string) => {
  const response = await adminApi.post<BoardingPlaceResponse>(`/admin/listings/${id}/reject`, {
    rejection_reason: rejectionReason || null,
  })
  return response.data
}

export default adminApi