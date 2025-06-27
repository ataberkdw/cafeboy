import axios from 'axios';

// Axios instance oluştur
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://cafeboy.onrender.com/api',
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // İsteğe header ekle
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - login sayfasına yönlendir
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Masalar API
export const masalarAPI = {
  getAll: () => api.get('/masalar'),
  create: (data) => api.post('/masalar', data),
  delete: (id) => api.delete(`/masalar/${id}`),
  toggle: (id) => api.patch(`/masalar/${id}/toggle`),
  getById: (id) => api.get(`/masalar/${id}`),
  createQR: (id) => api.post(`/masalar/${id}/qr`),
};

// Menü API
export const menuAPI = {
  getAll: () => api.get('/menu'),
  getAdmin: () => api.get('/menu/admin'),
  getById: (id) => api.get(`/menu/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  // Kategoriler
  getKategoriler: () => api.get('/menu/kategoriler'),
  createKategori: (data) => api.post('/menu/kategoriler', data),
  updateKategori: (id, data) => api.put(`/menu/kategoriler/${id}`, data),
  deleteKategori: (id) => api.delete(`/menu/kategoriler/${id}`),
};

// Siparişler API
export const siparislerAPI = {
  getAll: () => api.get('/siparisler'),
  getByMasa: (masaNo) => api.get(`/siparisler/masa/${masaNo}`),
  getById: (id) => api.get(`/siparisler/${id}`),
  create: (data) => api.post('/siparisler', data),
  updateStatus: (id, data) => api.patch(`/siparisler/${id}/durum`, data),
  complete: (id) => api.post(`/siparisler/${id}/tamamla`),
  clear: (id) => api.post(`/siparisler/${id}/temizle`),
};

// QR API
export const qrAPI = {
  getByMasaId: (masaId) => api.get(`/qrcode/${masaId}`),
  regenerate: (masaId) => api.post(`/qrcode/${masaId}/regenerate`),
  downloadAll: () => api.get('/qrcode/download/all'),
};

export default api; 