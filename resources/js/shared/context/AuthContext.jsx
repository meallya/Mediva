import { createContext, useCallback, useEffect, useState } from "react";
import authService from "../../modules/auth/services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [activeRole, setActiveRole] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const [loading, setLoading] = useState(true);

    const applyAuthData = useCallback((data) => {
        setUser(data?.user ?? null);
        setRoles(data?.roles ?? []);
        setActiveRole(data?.active_role ?? null);
        setPermissions(data?.permissions ?? []);
    }, []);

    const clearAuthData = useCallback(() => {
        setUser(null);
        setRoles([]);
        setActiveRole(null);
        setPermissions([]);
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const data = await authService.getCurrentUser();

            applyAuthData(data);
        } catch (error) {
            if (error.status !== 401) {
                console.error("Gagal mengambil data user:", error);
            }

            clearAuthData();
        } finally {
            setLoading(false);
        }
    }, [applyAuthData, clearAuthData]);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const login = async (credentials) => {
        const data = await authService.login(credentials);

        applyAuthData(data);

        return data;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            clearAuthData();
        }
    };

    const switchRole = async (assignmentId) => {
        const data = await authService.switchRole(assignmentId);

        applyAuthData(data);

        return data;
    };

    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (requiredPermissions = []) => {
        return requiredPermissions.some((permission) =>
            permissions.includes(permission),
        );
    };

    const isAuthenticated = Boolean(user);

    const value = {
        user,
        roles,
        activeRole,
        permissions,

        loading,
        isAuthenticated,

        login,
        logout,
        switchRole,
        fetchCurrentUser,

        hasPermission,
        hasAnyPermission,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
