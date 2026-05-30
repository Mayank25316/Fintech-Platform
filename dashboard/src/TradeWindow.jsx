import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./TradeWindow.css";

/**
 * TradeWindow — reusable Buy/Sell pop-up
 *
 * Props:
 *   stock    — { name: string, price: number }
 *   mode     — initial mode: "BUY" | "SELL"  (defaults to "BUY")
 *   onClose  — callback to close the window
 *   onSuccess — optional callback fired after a successful order (used for Holdings refresh)
 */
export default function TradeWindow({ stock, mode: initialMode = "BUY", onClose, onSuccess }) {
    const [activeMode,  setActiveMode]  = useState(initialMode);
    const [stockQty,    setStockQty]    = useState(1);
    const [stockPrice,  setStockPrice]  = useState(stock?.price ?? 0);
    const [isLoading,   setIsLoading]   = useState(false);
    const [message,     setMessage]     = useState(null); // { type: "error"|"success", text: string }

    // Sync price if parent updates the stock prop (e.g. live price changes)
    useEffect(() => {
        setStockPrice(stock?.price ?? 0);
    }, [stock?.price]);

    // Reset message whenever the user switches mode or changes qty/price
    const clearMessage = () => setMessage(null);

    const handleModeSwitch = (newMode) => {
        setActiveMode(newMode);
        clearMessage();
    };

    const marginRequired = (Number(stockQty) * Number(stockPrice)).toFixed(2);
    const isSell         = activeMode === "SELL";

    // ── Place order ────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        const qty   = Number(stockQty);
        const price = Number(stockPrice);

        if (!qty || qty <= 0) {
            setMessage({ type: "error", text: "Quantity must be a positive number." });
            return;
        }
        if (!price || price <= 0) {
            setMessage({ type: "error", text: "Price must be a positive number." });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/newOrder`,
                {
                    name:  stock.name,
                    qty,
                    price,
                    mode:  activeMode,
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: "success", text: `${activeMode} order placed successfully!` });
                // Allow the user to see the success flash, then close and refresh
                setTimeout(() => {
                    onClose?.();
                    onSuccess?.(); // triggers Holdings re-fetch in parent
                }, 800);
            } else {
                setMessage({ type: "error", text: response.data.message || "Order failed." });
            }
        } catch (error) {
            const serverMsg = error?.response?.data?.message;
            setMessage({
                type: "error",
                text: serverMsg || "Could not place order. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [stock, activeMode, stockQty, stockPrice, onClose, onSuccess]);

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    if (!stock) return null;

    return (
        <div className="trade-window-backdrop" onClick={handleBackdropClick}>
            <div className="trade-window" role="dialog" aria-modal="true" aria-label={`Trade ${stock.name}`}>

                {/* Header */}
                <div className="tw-header">
                    <h2 className="tw-stock-name">{stock.name}</h2>
                    <span className="tw-exchange-badge">NSE · Equity</span>

                    {/* BUY / SELL toggle tabs */}
                    <div className="tw-tabs" role="tablist">
                        <button
                            role="tab"
                            aria-selected={!isSell}
                            className={`tw-tab buy ${!isSell ? "active" : ""}`}
                            onClick={() => handleModeSwitch("BUY")}
                        >
                            BUY
                        </button>
                        <button
                            role="tab"
                            aria-selected={isSell}
                            className={`tw-tab sell ${isSell ? "active" : ""}`}
                            onClick={() => handleModeSwitch("SELL")}
                        >
                            SELL
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="tw-body">
                    <div className="tw-inputs">
                        {/* Quantity field */}
                        <fieldset className={`tw-field ${isSell ? "sell-mode" : ""}`}>
                            <legend>Qty.</legend>
                            <input
                                id="tw-qty"
                                type="number"
                                min="1"
                                value={stockQty}
                                onChange={(e) => { setStockQty(e.target.value); clearMessage(); }}
                            />
                        </fieldset>

                        {/* Price field */}
                        <fieldset className={`tw-field ${isSell ? "sell-mode" : ""}`}>
                            <legend>Price (₹)</legend>
                            <input
                                id="tw-price"
                                type="number"
                                min="0.05"
                                step="0.05"
                                value={stockPrice}
                                onChange={(e) => { setStockPrice(e.target.value); clearMessage(); }}
                            />
                        </fieldset>
                    </div>

                    {/* Margin strip */}
                    <div className="tw-margin-strip">
                        <span className="tw-margin-label">
                            {isSell ? "Estimated Proceeds" : "Margin Required"}
                        </span>
                        <span className="tw-margin-value">₹{marginRequired}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="tw-actions">
                        <button
                            id={`tw-confirm-${activeMode.toLowerCase()}`}
                            className={`tw-btn tw-btn-primary ${isSell ? "sell-btn" : "buy-btn"}`}
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? "Placing…" : `${activeMode} ${stock.name}`}
                        </button>
                        <button
                            id="tw-cancel"
                            className="tw-btn tw-btn-cancel"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Feedback message */}
                    {message && (
                        <p className={`tw-message ${message.type}`}>
                            {message.text}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
