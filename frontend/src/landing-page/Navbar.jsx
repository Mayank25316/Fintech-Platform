import Newlogo from "../assets/Media/logo.svg";
import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav
            className="navbar navbar-expand-lg border-bottom "
            style={{ backgroundColor: "white" }}
        >
            <div className="container-fluid p-2">
                <a className="navbar-brand" href="/"><img
                    src={Newlogo}
                    style={{ width: "100%", maxWidth: "129px", height: "auto", marginLeft:"180px" }}
                    alt="Zerodha Logo"/></a>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarScroll"
                    aria-controls="navbarScroll"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarScroll">
                    {/* 3. Removed <form>; Added 'ms-auto' to push links to the right */}
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link active" aria-current="page" to="/signup">
                                Signup
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/about">
                                About
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/product">
                                Products
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/pricing">
                                Pricing
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/support">
                                Support
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="#">
                                <i className="fa-solid fa-bars"></i>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}