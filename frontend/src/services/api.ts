import axios from 'axios';
import type { User, Order, DeliveryPartner, OrderStatus } from '../types';

const API_BASE_URL = 'https://zomato-opspro-backend.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for logging
api.interceptors.request.use(request => {
    console.log('Starting Request:', request);
    return request;
});

// Add response interceptor for logging
api.interceptors.response.use(
    response => {
        console.log('Response:', response);
        return response;
    },
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (username: string, password: string): Promise<User> => {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },
};

export const orderApi = {
    getAll: async (): Promise<Order[]> => {
        const response = await api.get('/orders');
        return response.data;
    },

    getByStatus: async (status: OrderStatus): Promise<Order[]> => {
        const response = await api.get(`/orders/status/${status}`);
        return response.data;
    },

    create: async (order: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
        const response = await api.post('/orders', order);
        return response.data;
    },

    assignPartner: async (orderId: number, partnerId: number): Promise<Order> => {
        const response = await api.post(`/orders/${orderId}/assign/${partnerId}`);
        return response.data;
    },

    updateStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
        const response = await api.put(`/orders/${orderId}/status?status=${status}`);
        return response.data;
    },
};

export const partnerApi = {
    getAll: async (): Promise<DeliveryPartner[]> => {
        const response = await api.get('/partners');
        return response.data;
    },

    getAvailable: async (): Promise<DeliveryPartner[]> => {
        const response = await api.get('/partners/available');
        return response.data;
    },

    create: async (partner: Omit<DeliveryPartner, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryPartner> => {
        const response = await api.post('/partners', partner);
        return response.data;
    },

    updateAvailability: async (partnerId: number, isAvailable: boolean): Promise<DeliveryPartner> => {
        const response = await api.put(`/partners/${partnerId}/availability?isAvailable=${isAvailable}`);
        return response.data;
    },

    updateEta: async (partnerId: number, eta: number): Promise<DeliveryPartner> => {
        const response = await api.put(`/partners/${partnerId}/eta?eta=${eta}`);
        return response.data;
    },
}; 