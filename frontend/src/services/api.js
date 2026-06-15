import axios from 'axios';

const isProduction = import.meta.env.PROD;
const API_BASE_URL = isProduction ? `${window.location.origin}` : 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor to attach JWT token to headers of all outgoing requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers['x-access-token'] = token;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
