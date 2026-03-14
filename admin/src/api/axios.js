import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Attach adminToken to every request
API.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
});

// Handle 401 (Unauthorized) responses
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Only redirect if NOT already on login page to avoid loops
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('adminToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;
