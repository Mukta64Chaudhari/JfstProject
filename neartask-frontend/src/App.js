import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar     from './components/Navbar';
import Login      from './pages/Login';
import Register   from './pages/Register';
import TaskBoard  from './pages/TaskBoard';
import NearbyWorkers from './pages/NearbyWorkers';
import Dashboard  from './pages/Dashboard';

function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Register />} />
                <Route path="/tasks"     element={<PrivateRoute><TaskBoard /></PrivateRoute>} />
                <Route path="/nearby"    element={<PrivateRoute><NearbyWorkers /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/"          element={<Navigate to="/tasks" />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}