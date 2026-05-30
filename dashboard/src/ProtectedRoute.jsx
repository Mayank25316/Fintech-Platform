import { Navigate } from "react-router-dom";
import { useAuthContext } from "./AuthContext";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * States:
 *  isLoading = true  → show a minimal spinner (session check in-flight)
 *  isAuthenticated   → render children normally
 *  !isAuthenticated  → redirect to /login (replaces history entry)
 *
 * This prevents the flash of dashboard UI that an unauthenticated user
 * would otherwise see for the ~200 ms the /verify-token call takes.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
        return (
            <div
                style={{
                    display:        "flex",
                    justifyContent: "center",
                    alignItems:     "center",
                    height:         "100vh",
                    flexDirection:  "column",
                    gap:            "12px",
                    color:          "#888",
                    fontSize:       "0.9rem",
                }}
            >
                <div className="auth-spinner" style={{ width: "28px", height: "28px", borderWidth: "3px" }} />
                Verifying session…
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
