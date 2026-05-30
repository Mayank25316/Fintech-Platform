import axios from "axios";
import { useState, useEffect, useCallback } from "react";

/**
 * Orders — today's executed orders in a card-based UI.
 *
 * Errors: shown as a dismissible banner with a retry button.
 * withCredentials: handled by axios.defaults in App.jsx.
 */
export default function Orders() {
    const [orders,    setOrders]    = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error,     setError]     = useState(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/allorders`,
                { withCredentials: true }
            );
            if (!Array.isArray(res.data)) throw new Error("Unexpected response format");

            const today = new Date().toISOString().split("T")[0];
            const todaysOrders = res.data.filter((order) => {
                if (!order.createdAt) return true;
                return new Date(order.createdAt).toISOString().split("T")[0] === today;
            });
            setOrders(todaysOrders);
        } catch (err) {
            console.error("Orders fetch error:", err);
            setError("Could not load orders. Please check your connection and try again.");
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const formatTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour:   "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="orders-page">
            <div className="page-header">
                <h3 className="page-title">Orders</h3>
                <span className="orders-count-badge">{orders.length} today</span>
            </div>

            {/* ── Error banner ───────────────────────────────────────────────── */}
            {error && (
                <div className="positions-error-banner" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.2"
                        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                    <button
                        className="positions-error-dismiss"
                        onClick={() => { setError(null); fetchOrders(); }}
                        aria-label="Retry"
                    >
                        Retry ↻
                    </button>
                </div>
            )}

            {/* ── Loading ────────────────────────────────────────────────────── */}
            {isLoading && !error && (
                <div className="positions-loading">
                    <span className="pos-spinner" />
                    Loading orders…
                </div>
            )}

            {/* ── Empty state ────────────────────────────────────────────────── */}
            {!isLoading && !error && orders.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p className="empty-text">No orders placed today</p>
                    <p className="empty-sub">Your executed trades will appear here.</p>
                </div>
            )}

            {/* ── Cards ──────────────────────────────────────────────────────── */}
            {!isLoading && !error && orders.length > 0 && (
                <div className="orders-card-list">
                    {orders.map((order, index) => {
                        const isBuy  = order.mode === "BUY";
                        const total  = (order.qty * order.price).toFixed(2);
                        return (
                            <div className="order-card" key={order._id || index}>
                                <div className="order-card-left">
                                    <span className={`mode-badge ${isBuy ? "buy-badge" : "sell-badge"}`}>
                                        {order.mode}
                                    </span>
                                    <div className="order-card-info">
                                        <span className="order-name">{order.name}</span>
                                        <span className="order-time">{formatTime(order.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="order-card-right">
                                    <div className="order-stat">
                                        <span className="stat-label">Qty</span>
                                        <span className="stat-value">{order.qty}</span>
                                    </div>
                                    <div className="order-stat">
                                        <span className="stat-label">Price</span>
                                        <span className="stat-value">₹{order.price.toFixed(2)}</span>
                                    </div>
                                    <div className="order-stat">
                                        <span className="stat-label">Total</span>
                                        <span className={`stat-value total-value ${isBuy ? "buy-total" : "sell-total"}`}>
                                            ₹{Number(total).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
