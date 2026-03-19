import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/login`,
                { email, password },
                { withCredentials: true } 
            );

            if (response.data.success) {
                alert("Login Successful! Welcome back.");
                setTimeout(() => {
                    window.location.href = import.meta.env.VITE_DASHBOARD_URL;
                }, 500);
            } else {
                alert(response.data.message); 
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Invalid Email or Password!");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="col-12 col-md-8 col-lg-5">
                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body p-5">

                        <h2 className="text-center mb-4 fw-bold" style={{ color: "#387ed1" }}>
                            Login to ZERODHA
                        </h2>

                        <form onSubmit={handleLogin}>

                            <div className="form-floating mb-3">
                                <input
                                    type="email"
                                    className="form-control"
                                    id="floatingEmail"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <label htmlFor="floatingEmail" className="text-muted">Email address</label>
                            </div>

                            <div className="form-floating mb-4">
                                <input
                                    type="password"
                                    className="form-control"
                                    id="floatingPassword"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <label htmlFor="floatingPassword" className="text-muted">Password</label>
                            </div>

                            <button
                                type="submit"
                                className="btn w-100 py-3 fw-bold text-white rounded-3 shadow-sm"
                                style={{ backgroundColor: "#387ed1", transition: "0.3s" }}
                            >
                                Login
                            </button>

                        </form>

                        <div className="text-center mt-4">
                            <p className="text-muted mb-0">
                                Don't have an account?{" "}
                                <Link
                                    to="/signup"
                                    className="text-decoration-none fw-semibold"
                                    style={{ color: "#387ed1" }}
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