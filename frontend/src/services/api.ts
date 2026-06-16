import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as { _retry?: boolean };
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(() => api(err.config))
          .catch(Promise.reject.bind(Promise));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(err.config);
      } catch (refreshErr) {
        processQueue(refreshErr);
        clearAuthSession();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  },
);

function clearAuthSession() {
  try {
    sessionStorage.removeItem('auth');
  } catch { /* ignore */ }
}

export default api;
