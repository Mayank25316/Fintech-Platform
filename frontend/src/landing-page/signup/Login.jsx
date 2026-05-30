import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [email,       setEmail]       = useState('');
    const [password,    setPassword]    = useState('');
    const [showPwd,     setShowPwd]     = useState(false);
    const [isLoading,   setIsLoading]   = useState(false);
    const [errorMsg,    setErrorMsg]    = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoading) return;          // prevent double-submit

        setIsLoading(true);
        setErrorMsg('');

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/login`,
                { email, password },
                { withCredentials: true }
            );

            if (response.data.success) {
                // Redirect to the dashboard SPA root.
                // ProtectedRoute's /verify-token check will confirm the cookie
                // and render the dashboard immediately.
                window.location.href = import.meta.env.VITE_DASHBOARD_URL;
            } else {
                setErrorMsg(response.data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrorMsg('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="col-12 col-md-8 col-lg-5">
                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body p-5">

                        <h2 className="text-center mb-4 fw-bold" style={{ color: '#387ed1' }}>
                            Login to ZERODHA
                        </h2>

                        {/* Inline error banner — replaces alert() */}
                        {errorMsg && (
                            <div className="alert alert-danger py-2 mb-3" role="alert">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleLogin} noValidate>

                            <div className="form-floating mb-3">
                                <input
                                    type="email"
                                    className="form-control"
                                    id="floatingEmail"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                                    required
                                    disabled={isLoading}
                                />
                                <label htmlFor="floatingEmail" className="text-muted">Email address</label>
                            </div>

                            {/* Password field with show/hide toggle */}
                            <div className="form-floating mb-4 position-relative">
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    className="form-control"
                                    id="floatingPassword"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                                    required
                                    disabled={isLoading}
                                    style={{ paddingRight: '3rem' }}
                                />
                                <label htmlFor="floatingPassword" className="text-muted">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: '#6c757d',
                                        padding: '0', lineHeight: 1, zIndex: 10,
                                    }}
                                >
                                    {showPwd ? (
                                        /* Eye-off icon */
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                            <line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        /* Eye icon */
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="btn w-100 py-3 fw-bold text-white rounded-3 shadow-sm"
                                style={{
                                    backgroundColor: isLoading ? '#6c9fd4' : '#387ed1',
                                    transition: '0.3s',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status" aria-hidden="true"
                                        />
                                        Logging in…
                                    </>
                                ) : 'Login'}
                            </button>

                        </form>

                        <div className="text-center mt-4">
                            <p className="text-muted mb-0">
                                Don't have an account?{' '}
                                <Link
                                    to="/signup"
                                    className="text-decoration-none fw-semibold"
                                    style={{ color: '#387ed1' }}
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}