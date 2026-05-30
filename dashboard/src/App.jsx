import { Route, Routes, Navigate } from "react-router-dom";
import axios from "axios";
import Home           from "./Home.jsx";
import Login          from "./Login.jsx";
import Signup         from "./Signup.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useAuthContext } from "./AuthContext.jsx";

// Set withCredentials globally so every axios call sends the httpOnly cookie
axios.defaults.withCredentials = true;

/**
 * AuthRoute — wraps /login and /signup.
 * If the user is already authenticated, bounces them to the dashboard home.
 * While the session check is still in-flight (isLoading), renders nothing
 * to avoid a flash of the login form.
 */
function AuthRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthContext();
    if (isLoading) return null;                          // wait — avoid flash
    if (isAuthenticated) return <Navigate to="/" replace />; // already logged in
    return children;
}

/**
 * App — root router for the dashboard SPA.
 *
 * Routes:
 *   /login   → Login page  (public — redirects home if already authed)
 *   /signup  → Signup page (public — redirects home if already authed)
 *   /*       → Dashboard   (protected — redirects to /login if unauthed)
 *
 * Why Login/Signup live in the dashboard SPA (not the frontend app):
 *   • useNavigate() requires being inside the same BrowserRouter instance.
 *   • AuthContext.login() sets state in-memory; a cross-app window.location.href
 *     would unmount the context and force a round-trip to re-hydrate it.
 *   • Keeping auth inside the dashboard SPA enables zero-reload navigation
 *     and instant username display after login — no extra GET /funds call.
 */
export default function App() {
    return (
        <Routes>
            {/* ── Public auth routes (redirect home if already logged in) ── */}
            <Route path="/login"  element={<AuthRoute><Login /></AuthRoute>}  />
            <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

            {/* ── Protected dashboard routes ── */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
