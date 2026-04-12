import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/api'
});

API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const register    = (data)        => API.post('/auth/register', data);
export const login       = (data)        => API.post('/auth/login', data);

export const getAllTasks  = ()           => API.get('/tasks');
export const createTask  = (data)       => API.post('/tasks', data);
export const completeTask = (id)        => API.put(`/tasks/${id}/complete`);
export const getMyTasks  = (userId)     => API.get(`/tasks/my/${userId}`);

export const getNearbyWorkers = (lat, lng) => API.get(`/users/nearby?lat=${lat}&lng=${lng}`);
export const updateLocation   = (id, lat, lng) => API.put(`/users/${id}/location?lat=${lat}&lng=${lng}`);

export const acceptTask      = (taskId, workerId) => API.post(`/bookings/accept?taskId=${taskId}&workerId=${workerId}`);
export const completeBooking = (id)     => API.put(`/bookings/${id}/complete`);
export const getWorkerBookings = (id)   => API.get(`/bookings/worker/${id}`);