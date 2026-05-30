import axios from "axios";
import { useState, useEffect } from "react";

export default function Orders() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/allorders`, { withCredentials: true })
            .then((res) => {
                const today = new Date().toISOString().split("T")[0];
                const todaysOrders = res.data.filter((order) => {
                    if (!order.createdAt) return true;
                    return new Date(order.createdAt).toISOString().split("T")[0] === today;
                });
                setOrders(todaysOrders);
            })
            .catch((err) => console.error("Orders fetch error:", err));
    }, []);

    const formatTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour: "2-digit",
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

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p className="empty-text">No orders placed today</p>
                    <p className="empty-sub">Your executed trades will appear here.</p>
                </div>
            ) : (
                <div className="orders-card-list">
                    {orders.map((order, index) => {
                        const isBuy    = order.mode === "BUY";
                        const total    = (order.qty * order.price).toFixed(2);
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
