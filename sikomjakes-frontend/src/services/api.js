import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getChartTahun: () => api.get('/dashboard/chart/tahun'),
  getChartJabfung: () => api.get('/dashboard/chart/jabfung'),
  getChartKelulusan: () => api.get('/dashboard/chart/kelulusan'),
  getChartProvinsi: () => api.get('/dashboard/chart/provinsi'),
  getRecentActivities: () => api.get('/dashboard/recent-activities')
}

// Jabfung API
export const jabfungAPI = {
  getAll: (params) => api.get('/jabfung', { params }),
  getById: (id) => api.get(`/jabfung/${id}`),
  create: (data) => api.post('/jabfung', data),
  update: (id, data) => api.put(`/jabfung/${id}`, data),
  delete: (id) => api.delete(`/jabfung/${id}`)
}

// Formasi API
export const formasiAPI = {
  getAll: (params) => api.get('/formasi', { params }),
  getById: (id) => api.get(`/formasi/${id}`),
  create: (data) => api.post('/formasi', data),
  update: (id, data) => api.put(`/formasi/${id}`, data),
  delete: (id) => api.delete(`/formasi/${id}`),
  getBazzetting: () => api.get('/formasi/stats/bazzetting')
}

// Peserta API
export const pesertaAPI = {
  getAll: (params) => api.get('/peserta', { params }),
  getById: (id) => api.get(`/peserta/${id}`),
  register: (data) => api.post('/peserta', data),
  checkNik: (nik) => api.get(`/peserta/check-nik/${nik}`),
  uploadDokumen: (id, formData) => api.post(`/peserta/${id}/dokumen`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDokumen: (id) => api.get(`/peserta/${id}/dokumen`)
}

// Admin API
export const adminAPI = {
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Verify peserta
  verifyPeserta: (id, data) => api.put(`/admin/peserta/${id}/verify`, data),
  
  // Validate dokumen
  validateDokumen: (pesertaId, dokumenId, data) => 
    api.put(`/admin/peserta/${pesertaId}/dokumen/${dokumenId}/validate`, data),
  
  // Input hasil UKOM
  inputHasil: (id, data) => api.put(`/admin/peserta/${id}/hasil`, data),
  
  // Instansi
  getInstansi: () => api.get('/admin/instansi'),
  createInstansi: (data) => api.post('/admin/instansi', data),
  
  // Audit logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params })
}
