import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:9000/api'
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
export const getUser          = (id)     => API.get(`/users/${id}`);

export const acceptTask      = (taskId, workerId) => API.post(`/bookings/accept?taskId=${taskId}&workerId=${workerId}`);
export const completeBooking = (id)     => API.put(`/bookings/${id}/complete`);
export const getWorkerBookings = (id)   => API.get(`/bookings/worker/${id}`);
export const getTaskBooking   = (taskId) => API.get(`/bookings/task/${taskId}`);

export const createReview    = (data)   => API.post('/reviews', data);
export const getWorkerReviews = (id)   => API.get(`/reviews/worker/${id}`);
export const getWorkerRating = (id)    => API.get(`/reviews/worker/${id}/rating`);
