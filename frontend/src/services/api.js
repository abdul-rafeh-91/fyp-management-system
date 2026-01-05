import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// User API
export const userAPI = {
  getById: (id) => api.get(`/users/${id}`),
  getByEmail: (email) => api.get(`/users/email/${email}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getAll: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
};

// Document API
export const documentAPI = {
  create: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadVersion: (id, formData) => api.post(`/documents/${id}/upload-version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submit: (id) => api.post(`/documents/${id}/submit`),
  assignSupervisor: (id, supervisorId) => api.patch(`/documents/${id}/assign-supervisor?supervisorId=${supervisorId}`),
  updateStatus: (id, status) => api.patch(`/documents/${id}/status?status=${status}`),
  getById: (id) => api.get(`/documents/${id}`),
  getByStudent: (studentId) => api.get(`/documents/student/${studentId}`),
  getBySupervisor: (supervisorId) => api.get(`/documents/supervisor/${supervisorId}`),
  getAllSubmitted: () => api.get('/documents/submitted'),
  getByStatus: (status) => api.get(`/documents/status/${status}`),
  getVersions: (id) => api.get(`/documents/${id}/versions`),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
};

// Review API
export const reviewAPI = {
  create: (reviewData, reviewerId) => api.post(`/reviews?reviewerId=${reviewerId}`, reviewData),
  getById: (id) => api.get(`/reviews/${id}`),
  getByDocument: (documentId) => api.get(`/reviews/document/${documentId}`),
  getByReviewer: (reviewerId) => api.get(`/reviews/reviewer/${reviewerId}`),
};

// Grade API
export const gradeAPI = {
  create: (gradeData, evaluatorId) => api.post(`/grades?evaluatorId=${evaluatorId}`, gradeData),
  update: (id, gradeData) => api.put(`/grades/${id}`, gradeData),
  release: (id) => api.patch(`/grades/${id}/release`),
  releaseAll: (documentId) => api.patch(`/grades/document/${documentId}/release-all`),
  getById: (id) => api.get(`/grades/${id}`),
  getByDocument: (documentId) => api.get(`/grades/document/${documentId}`),
  getReleasedByDocument: (documentId) => api.get(`/grades/document/${documentId}/released`),
  getByEvaluator: (evaluatorId) => api.get(`/grades/evaluator/${evaluatorId}`),
  getTotalScore: (documentId) => api.get(`/grades/document/${documentId}/total-score`),
};

// Notification API
export const notificationAPI = {
  getByUser: (userId) => api.get(`/notifications/user/${userId}`),
  getUnread: (userId) => api.get(`/notifications/user/${userId}/unread`),
  getUnreadCount: (userId) => api.get(`/notifications/user/${userId}/unread-count`),
  markAsRead: (id) => api.patch(`/notifications/${id}/mark-read`),
  markAllAsRead: (userId) => api.patch(`/notifications/user/${userId}/mark-all-read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Deadline API
export const deadlineAPI = {
  create: (data) => api.post('/deadlines', null, { params: data }),
  getByType: (type) => api.get(`/deadlines/type/${type}`),
  getAllActive: () => api.get('/deadlines/active'),
  getAll: () => api.get('/deadlines'),
  deactivate: (id) => api.patch(`/deadlines/${id}/deactivate`),
};

export default api;

