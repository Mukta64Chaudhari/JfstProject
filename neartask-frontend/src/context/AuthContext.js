import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const token  = localStorage.getItem('token');
        const role   = localStorage.getItem('role');
        const name   = localStorage.getItem('name');
        const userId = localStorage.getItem('userId');
        return token ? { token, role, name, userId } : null;
    });

    const loginUser = (data) => {
        localStorage.setItem('token',  data.token);
        localStorage.setItem('role',   data.role);
        localStorage.setItem('name',   data.name);
        localStorage.setItem('userId', data.userId);
        setUser(data);
    };

    const logoutUser = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);