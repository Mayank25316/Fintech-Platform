import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault(); 

        try {
            const response = await axios.post(
                "http://localhost:3000/signup",
                { username, email, password },
                { withCredentials: true }
            );

            if (response.data.success) {
                alert("Signup Successful! Redirecting to Dashboard...");

                navigate("/"); 
            } else {
                alert(response.data.message); 
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Something went wrong!");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="col-12 col-md-8 col-lg-5">
                <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body p-5">

                        <h2 className="text-center mb-4 fw-bold" style={{ color: "#387ed1" }}>
                            Create ZEROSTOX Account
                        </h2>

                        <form onSubmit={handleSignup}>

                            <div className="form-floating mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="floatingUsername"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <label htmlFor="floatingUsername" className="text-muted">Username</label>
                            </div>

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
                                Sign Up
                            </button>

                        </form>

                        <div className="text-center mt-4">
                            <p className="text-muted mb-0">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="text-decoration-none fw-semibold"
                                    style={{ color: "#387ed1" }}
                                >
                                    Login here
                                </Link>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>);
}