import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

function normalizeSkills(data = {}) {
    if (Array.isArray(data.skills) && data.skills.length > 0) {
        return data.skills;
    }
    if (data.skill) {
        return [data.skill];
    }
    return [];
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const token  = localStorage.getItem('token');
        const role   = localStorage.getItem('role');
        const name   = localStorage.getItem('name');
        const userId = localStorage.getItem('userId');
        const skill  = localStorage.getItem('skill');
        const skillsRaw = localStorage.getItem('skills');

        let skills = [];
        if (skillsRaw) {
            try {
                const parsed = JSON.parse(skillsRaw);
                skills = Array.isArray(parsed) ? parsed : [];
            } catch {
                skills = [];
            }
        }
        if (skills.length === 0 && skill) {
            skills = [skill];
        }

        return token ? { token, role, name, userId, skill: skill || (skills[0] || ''), skills } : null;
    });

    const loginUser = (data) => {
        const skills = normalizeSkills(data);
        const primarySkill = data.skill || skills[0] || '';
        const userData = { ...data, skill: primarySkill, skills };

        localStorage.setItem('token',  data.token);
        localStorage.setItem('role',   data.role);
        localStorage.setItem('name',   data.name);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('skill',  primarySkill);
        localStorage.setItem('skills', JSON.stringify(skills));
        setUser(userData);
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