import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/api/auth/me");
        setUser(response.data?.user ?? response.data ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

    const login = useCallback(async (email, password) => {
    await api.post("/api/auth/login", { email, password });
    const response = await api.get("/api/auth/me");
    const resolvedUser = response.data?.user ?? response.data ?? null;
    setUser(resolvedUser);
    return resolvedUser;
    }, []);

    const signup = useCallback(async (email, password, name) => {
    await api.post("/api/auth/signup", { email, password, name });
    const response = await api.get("/api/auth/me");
    const resolvedUser = response.data?.user ?? response.data ?? null;
    setUser(resolvedUser);
    return resolvedUser;
    }, []);

    const logout = useCallback(async () => {
    try {
        await api.post("/api/auth/logout");
    } finally {
        setUser(null);
    }
    }, []);

    const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout]
    );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

