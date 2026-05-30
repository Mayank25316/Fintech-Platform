import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "./AuthContext";

/**
 * Signup — dashboard-native signup page.
 *
 * Lives at /signup in the dashboard SPA.
 * After successful signup:
 *  1. AuthContext.login(username) — populates username immediately
 *  2. navigate("/")              — SPA-navigate to dashboard home
 */
export default function Signup() {
    const navigate  = useNavigate();
    const { login } = useAuthContext();

    const [username, setUsername] = useState("");
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
                `${import.meta.env.VITE_API_URL}/signup`,
                { username, email, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                // Populate AuthContext immediately — signup returns the user object
                login(res.data.user?.username || username);
                navigate("/");
            } else {
                setErrorMsg(res.data.message || "Signup failed. Please try again.");
            }
        } catch (err) {
            console.error("Signup error:", err);
            setErrorMsg("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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

                <div className="auth-logo">
                    <span className="auth-logo-z">ZERO</span>
                    <span className="auth-logo-stox">STOX</span>
                </div>

                <h2 className="auth-title">Create your account</h2>
                <p className="auth-subtitle">Start trading in minutes — no minimums</p>

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

                    <div className="auth-field">
                        <label htmlFor="auth-username" className="auth-label">Username</label>
                        <input
                            id="auth-username"
                            type="text"
                            className="auth-input"
                            placeholder="e.g. mayank123"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setErrorMsg(""); }}
                            required
                            disabled={isLoading}
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

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
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="auth-password" className="auth-label">Password</label>
                        <div className="auth-input-wrap">
                            <input
                                id="auth-password"
                                type={showPwd ? "text" : "password"}
                                className="auth-input"
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                                required
                                disabled={isLoading}
                                autoComplete="new-password"
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

                    <button
                        type="submit"
                        id="auth-signup-btn"
                        className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="auth-spinner" aria-hidden="true" />
                                Creating account…
                            </>
                        ) : "Create Account"}
                    </button>

                </form>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-link">Login here</Link>
                </p>

            </div>
        </div>
    );
}
