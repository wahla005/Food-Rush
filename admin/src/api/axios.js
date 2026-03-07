import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5001/api',
});

// Attach adminToken to every request
API.interceptors.request.use((config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
});

export default API;
