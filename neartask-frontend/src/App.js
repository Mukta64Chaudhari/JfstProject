import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar     from './components/Navbar';
import Login      from './pages/Login';
import TaskBoard  from './pages/TaskBoard';
import PostTask   from './pages/PostTask';
import NearbyWorkers from './pages/NearbyWorkers';
import MyTasks    from './pages/MyTasks';
import Welcome    from './pages/Welcome';

function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
    const location = useLocation();
    const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

    return (
        <>
            {!hideNavbar && <Navbar />}
            <Routes>
                <Route path="/login"     element={<Login />} />
                <Route path="/register"  element={<Navigate to="/login?mode=register" replace />} />
                <Route path="/tasks"     element={<PrivateRoute><TaskBoard /></PrivateRoute>} />
                <Route path="/post-task" element={<PrivateRoute><PostTask /></PrivateRoute>} />
                <Route path="/nearby"    element={<PrivateRoute><NearbyWorkers /></PrivateRoute>} />
                <Route path="/my-tasks"  element={<PrivateRoute><MyTasks /></PrivateRoute>} />
                <Route path="/dashboard" element={<Navigate to="/my-tasks" replace />} />
                <Route path="/welcome"   element={<PrivateRoute><Welcome /></PrivateRoute>} />
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