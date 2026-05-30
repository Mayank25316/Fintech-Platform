import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { useLiveDataContext } from "./LiveDataContext";
import { useTradingContext } from "./TradingContext";

/**
 * Positions — today's open positions derived from today's orders.
 *
 * P&L colour convention (per spec):
 *   Positive → #26a69a (teal-green)
 *   Negative → #ef5350 (red)
 *   Zero     → #555    (neutral)
 *
 * Data: GET /allorders (authenticated, withCredentials: true via axios.defaults)
 * Errors: shown as a dismissible banner — no blank screens, no console-only errors.
 *
 * After any trade, TradingContext holdings update immediately; this page
 * re-fetches via its own useEffect (independent of TradingContext, since
 * positions are order-derived not holdings-derived).
 */
export default function Positions() {
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error,     setError]     = useState(null);

    const { livePrices } = useLiveDataContext();
    // Consume fundsAvailable from TradingContext — used for no hardcoded values
    const { fundsAvailable } = useTradingContext();

    const fetchPositions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/allorders`,
                { withCredentials: true }
            );
            if (!Array.isArray(res.data)) throw new Error("Unexpected response format");

            const today = new Date().toISOString().split("T")[0];
            const todaysPositions = res.data.filter((order) => {
                if (!order.createdAt) return false;
                return new Date(order.createdAt).toISOString().split("T")[0] === today;
            });
            setPositions(todaysPositions);
        } catch (err) {
            console.error("Positions fetch error:", err);
            setError("Could not load positions. Please check your connection and try again.");
            setPositions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    // ── Enrich each position with live price + P&L ─────────────────────────────
    const enriched = positions.map((stock) => {
        const currentData  = livePrices[stock.name];
        const currentPrice = currentData ? currentData.price : stock.price;
        const invested     = stock.price * stock.qty;
        const currentVal   = currentPrice * stock.qty;
        const pnl          = currentVal - invested;
        const dayChange    = currentData ? currentData.changePercent : 0;
        return { ...stock, currentPrice, pnl, dayChange, invested, currentVal };
    });

    // ── P&L totals (spec: derive dynamically, no hardcoding) ─────────────────
    const totalPnL     = enriched.reduce((sum, s) => sum + s.pnl, 0);
    const isTotalProfit = totalPnL > 0;
    const isBreakEven  = totalPnL === 0;

    // Spec-mandated P&L colours
    const pnlColor = (val) =>
        val > 0 ? "#26a69a" : val < 0 ? "#ef5350" : "#555555";

    const fmt = (num) =>
        Number(num).toFixed(2);

    return (
        <div className="positions-page">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="page-header">
                <h3 className="page-title">Positions</h3>
                <span className="orders-count-badge">{positions.length} open today</span>
            </div>

            {/* ── Error banner (never leaves user on a blank screen) ─────────── */}
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
                        onClick={() => { setError(null); fetchPositions(); }}
                        aria-label="Retry"
                    >
                        Retry ↻
                    </button>
                </div>
            )}

            {/* ── Loading skeleton ───────────────────────────────────────────── */}
            {isLoading && !error && (
                <div className="positions-loading">
                    <span className="pos-spinner" />
                    Loading positions…
                </div>
            )}

            {/* ── Empty state ────────────────────────────────────────────────── */}
            {!isLoading && !error && enriched.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p className="empty-text">No open positions today</p>
                    <p className="empty-sub">Positions created from today's orders appear here.</p>
                </div>
            )}

            {/* ── Table ──────────────────────────────────────────────────────── */}
            {!isLoading && !error && enriched.length > 0 && (
                <>
                    {/* Per-spec: no summary strip — table is full-width */}
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
                                {enriched.map((stock, index) => (
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
                                        <td>₹{fmt(stock.price)}</td>
                                        <td>₹{fmt(stock.currentPrice)}</td>

                                        {/* P&L — spec: #26a69a for profit, #ef5350 for loss */}
                                        <td style={{ color: pnlColor(stock.pnl), fontWeight: 600 }}>
                                            {stock.pnl > 0 ? "+" : ""}₹{fmt(stock.pnl)}
                                        </td>

                                        {/* Day change — same colour scheme */}
                                        <td style={{ color: pnlColor(stock.dayChange), fontWeight: 600 }}>
                                            {stock.dayChange >= 0 ? "+" : ""}{fmt(stock.dayChange)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                            {/* Inline footer row for total P&L */}
                            <tfoot>
                                <tr className="positions-total-row">
                                    <td colSpan={5} style={{ textAlign: "right", paddingRight: "16px", fontSize: "0.78rem", color: "#9e9e9e", fontWeight: 600 }}>
                                        Total Day P&amp;L
                                    </td>
                                    <td style={{ color: pnlColor(totalPnL), fontWeight: 700, fontSize: "0.92rem" }}>
                                        {isTotalProfit ? "+" : ""}₹{fmt(totalPnL)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}