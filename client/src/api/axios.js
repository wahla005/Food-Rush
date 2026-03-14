import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

API.interceptors.request.use((config) => {
    const userToken = localStorage.getItem('token');
    if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
    }
    return config;
});

export default API;
