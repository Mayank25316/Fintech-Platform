import axios from "axios";
import { useState, useEffect } from "react";
import { useLiveDataContext } from "./LiveDataContext";

export default function Positions() {
    const [positions, setPositions] = useState([]);
    const { livePrices }            = useLiveDataContext();

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/allorders`, { withCredentials: true })
            .then((res) => {
                const today = new Date().toISOString().split("T")[0];
                const todaysPositions = res.data.filter((order) => {
                    if (!order.createdAt) return false;
                    return new Date(order.createdAt).toISOString().split("T")[0] === today;
                });
                setPositions(todaysPositions);
            })
            .catch((err) => console.error("Positions fetch error:", err));
    }, []);

    const enriched = positions.map((stock) => {
        const currentData  = livePrices[stock.name];
        const currentPrice = currentData ? currentData.price : stock.price;
        const invested     = stock.price * stock.qty;
        const currentVal   = currentPrice * stock.qty;
        const pnl          = currentVal - invested;
        const dayChange    = currentData ? currentData.changePercent : 0;
        return { ...stock, currentPrice, pnl, dayChange, invested, currentVal };
    });


    return (
        <div className="positions-page">
            {/* Header */}
            <div className="page-header">
                <h3 className="page-title">Positions</h3>
                <span className="orders-count-badge">{positions.length} open</span>
            </div>




            {enriched.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p className="empty-text">No open positions today</p>
                    <p className="empty-sub">Positions created from today's orders appear here.</p>
                </div>
            ) : (
                <div className="positions-table-wrap">
                    <table className="positions-table">
                        <thead>
                            <tr>
                                <th className="pt-left">Instrument</th>
                                <th>Type</th>
                                <th>Qty</th>
                                <th>Avg Price</th>
                                <th>LTP</th>
                                <th>P&amp;L</th>
                                <th>Day Chg.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enriched.map((stock, index) => {
                                const isProfit    = stock.pnl >= 0;
                                const isDayProfit = stock.dayChange >= 0;
                                return (
                                    <tr className="positions-row" key={stock._id || index}>
                                        <td className="pt-instrument">
                                            <span className="pt-name">{stock.name}</span>
                                            <span className="pt-type-badge">CNC</span>
                                        </td>
                                        <td>
                                            <span className={`mode-badge ${stock.mode === "BUY" ? "buy-badge" : "sell-badge"}`}>
                                                {stock.mode}
                                            </span>
                                        </td>
                                        <td>{stock.qty}</td>
                                        <td>₹{stock.price.toFixed(2)}</td>
                                        <td>₹{stock.currentPrice.toFixed(2)}</td>
                                        <td className={isProfit ? "profit-text" : "loss-text"}>
                                            {isProfit ? "+" : ""}₹{stock.pnl.toFixed(2)}
                                        </td>
                                        <td className={isDayProfit ? "profit-text" : "loss-text"}>
                                            {isDayProfit ? "+" : ""}{stock.dayChange.toFixed(2)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}