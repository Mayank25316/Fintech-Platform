import { createContext, useState, useContext, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * AuthContext — single source of truth for authentication state.
 *
 * Provides:
 *   username        — display name (string | null)
 *   isAuthenticated — boolean (true once a valid session is confirmed)
 *   isLoading       — true while the session check is in flight on mount
 *   login(username) — call immediately after a successful login API response
 *                     to populate state without a round-trip
 *   logout()        — clears cookie + redirects to the landing/login page
 *
 * Session bootstrap (mount):
 *   Calls POST /verify-token — if the httpOnly cookie is valid the backend
 *   returns { status: true, user: username }. On 401/failure the user is
 *   treated as unauthenticated (isAuthenticated = false).
 */

const AuthContext = createContext({
    username:        null,
    isAuthenticated: false,
    isLoading:       true,
    login:           (_username) => {},
    logout:          () => {},
});

export const AuthContextProvider = ({ children }) => {
    const [username,        setUsername]        = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading,       setIsLoading]       = useState(true); // true until session check completes

    // ── Session bootstrap on mount ────────────────────────────────────────────
    // POST /verify-token — uses the existing httpOnly cookie.
    // This is the ONLY place we do a network call for auth state.
    // All subsequent state changes go through login() / logout().
    useEffect(() => {
        axios
            .post(
                `${import.meta.env.VITE_API_URL}/verify-token`,
                {},
                { withCredentials: true }
            )
            .then((res) => {
                if (res.data?.status && res.data?.user) {
                    setUsername(res.data.user);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(() => {
                // 401 or network error → treat as unauthenticated
                setIsAuthenticated(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    /**
     * login — called immediately after a successful API login/signup response.
     * Populates username in-memory with zero latency (no extra round-trip).
     *
     * @param {string} uname — the username returned by the backend response
     */
    const login = useCallback((uname) => {
        setUsername(uname);
        setIsAuthenticated(true);
    }, []);

    /**
     * logout — clears the httpOnly cookie via POST /logout, resets local state,
     * then redirects to the landing page instantly (hard redirect so no stale
     * dashboard context survives).
     */
    const logout = useCallback(async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/logout`,
                {},
                { withCredentials: true }
            );
        } catch (_) {
            // Redirect regardless — even if the API call fails
        }
        setUsername(null);
        setIsAuthenticated(false);
        // Hard-redirect so the dashboard is fully unmounted
        window.location.href = import.meta.env.VITE_FRONTEND_URL || "/";
    }, []);

    return (
        <AuthContext.Provider value={{ username, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
