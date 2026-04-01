import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', // Use env var or empty string for proxy
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
       // Optional: Handle token expiration (e.g., logout)
       // localStorage.removeItem('token')
       // window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
