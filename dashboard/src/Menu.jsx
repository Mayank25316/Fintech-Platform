import kite from "./assets/kite.svg";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "./AuthContext";
import useClickOutside from "./useClickOutside";

export default function Menu() {
    const { username, logout } = useAuthContext();
    const [selectedMenu, setSelectedMenu] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Close dropdown when clicking anywhere outside the profile widget
    const closeDropdown = useCallback(() => setDropdownOpen(false), []);
    const profileRef    = useClickOutside(closeDropdown, dropdownOpen);

    const handleProfileClick = () => setDropdownOpen((prev) => !prev);

    // Derive avatar initials from the first two chars of username
    const avatarText = username
        ? username.slice(0, 2).toUpperCase()
        : "ZU";

    const menuClass       = "menu";
    const activeMenuClass = "menu selected";

    const navLinks = [
        { label: "Dashboard", path: "/",          index: 0 },
        { label: "Orders",    path: "/orders",     index: 1 },
        { label: "Holdings",  path: "/holdings",   index: 2 },
        { label: "Positions", path: "/positions",  index: 3 },
        { label: "Funds",     path: "/funds",      index: 4 },
        { label: "Apps",      path: "/apps",       index: 5 },
    ];

    return (
        <div className="menu-container">
            <img src={kite} style={{ width: "250px" }} alt="Zerostox" />

            <div className="menus">
                <ul>
                    {navLinks.map(({ label, path, index }) => (
                        <li key={index}>
                            <Link
                                style={{ textDecoration: "none" }}
                                to={path}
                                onClick={() => setSelectedMenu(index)}
                            >
                                <p className={selectedMenu === index ? activeMenuClass : menuClass}>
                                    {label}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>

                <hr />

                {/* ── Profile widget + dropdown ── */}
                <div className="profile-wrapper" ref={profileRef}>
                    <div
                        className="profile"
                        onClick={handleProfileClick}
                        aria-haspopup="true"
                        aria-expanded={dropdownOpen}
                        title="Account options"
                    >
                        <div className="avatar">{avatarText}</div>
                        <p className="username">
                            {username ?? "Loading…"}
                        </p>
                        {/* Chevron rotates when open */}
                        <span
                            className="profile-chevron"
                            style={{
                                marginLeft: "6px",
                                fontSize: "0.6rem",
                                color: "#999",
                                display: "inline-block",
                                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s",
                            }}
                        >
                            ▾
                        </span>
                    </div>

                    {/* Logout dropdown */}
                    {dropdownOpen && (
                        <div className="profile-dropdown" role="menu">
                            <div className="profile-dropdown-header">
                                <span className="profile-dropdown-name">
                                    {username ?? ""}
                                </span>
                                <span className="profile-dropdown-sub">Zerostox Account</span>
                            </div>
                            <div className="profile-dropdown-divider" />
                            <button
                                className="profile-dropdown-item logout-item"
                                role="menuitem"
                                onClick={logout}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14" height="14"
                                    viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    style={{ marginRight: "8px", flexShrink: 0 }}
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
