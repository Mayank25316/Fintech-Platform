import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "./AuthContext";

/**
 * Login — dashboard-native login page.
 *
 * Lives at /login inside the dashboard SPA so we can use useNavigate()
 * for instant in-app routing without a full page reload.
 *
 * After a successful API response:
 *  1. AuthContext.login(username) — populates username immediately (zero latency)
 *  2. navigate("/")              — SPA-navigate to the dashboard home
 */
export default function Login() {
    const navigate           = useNavigate();
    const { login }          = useAuthContext();

    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [showPwd,  setShowPwd]  = useState(false);
    const [isLoading,setIsLoading]= useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        setErrorMsg("");

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/login`,
                { email, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                // 1. Populate AuthContext immediately — no extra /funds round-trip
                login(res.data.username || email.split("@")[0]);
                // 2. SPA-navigate — no page reload, AuthContext state survives
                navigate("/");
            } else {
                setErrorMsg(res.data.message || "Login failed. Please try again.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setErrorMsg("Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Eye-icon SVGs (inline, zero dependency) ─────────────────────────── */
    const EyeOpen = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );
    const EyeOff = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );

    return (
        <div className="auth-page">
            <div className="auth-card">

                {/* Logo strip */}
                <div className="auth-logo">
                    <span className="auth-logo-z">ZERO</span>
                    <span className="auth-logo-stox">STOX</span>
                </div>

                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-subtitle">Sign in to your trading account</p>

                {/* Error banner */}
                {errorMsg && (
                    <div className="auth-error" role="alert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>

                    {/* Email */}
                    <div className="auth-field">
                        <label htmlFor="auth-email" className="auth-label">Email address</label>
                        <input
                            id="auth-email"
                            type="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    {/* Password + eye toggle */}
                    <div className="auth-field">
                        <label htmlFor="auth-password" className="auth-label">Password</label>
                        <div className="auth-input-wrap">
                            <input
                                id="auth-password"
                                type={showPwd ? "text" : "password"}
                                className="auth-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="auth-eye-btn"
                                onClick={() => setShowPwd((v) => !v)}
                                aria-label={showPwd ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPwd ? <EyeOff /> : <EyeOpen />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        id="auth-login-btn"
                        className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="auth-spinner" aria-hidden="true" />
                                Signing in…
                            </>
                        ) : "Login"}
                    </button>

                </form>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/signup" className="auth-link">Create one here</Link>
                </p>

            </div>
        </div>
    );
}
