import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./TradeWindow.css";

/**
 * TradeWindow — reusable Buy/Sell pop-up
 *
 * Props:
 *   stock      — { name, price, qty? }  qty is the user's currently held quantity
 *   mode       — initial mode: "BUY" | "SELL"  (defaults to "BUY")
 *   onClose    — callback to close the window
 *   onSuccess  — callback(updatedHolding, fundsAvailable) after a successful order
 */
export default function TradeWindow({ stock, mode: initialMode = "BUY", onClose, onSuccess }) {
    const [activeMode,  setActiveMode]  = useState(initialMode);
    const [orderType,   setOrderType]   = useState("MARKET");   // "MARKET" | "LIMIT"
    const [stockQty,    setStockQty]    = useState(1);
    const [stockPrice,  setStockPrice]  = useState(stock?.price ?? 0);
    const [isLoading,   setIsLoading]   = useState(false);
    const [message,     setMessage]     = useState(null); // { type: "error"|"success", text }

    const heldQty = stock?.qty ?? 0; // quantity currently held — used for SELL validation

    // Sync price when stock prop changes (live price update)
    useEffect(() => {
        setStockPrice(stock?.price ?? 0);
    }, [stock?.price]);

    const clearMessage = () => setMessage(null);

    const handleModeSwitch = (newMode) => {
        setActiveMode(newMode);
        setStockQty(1);
        clearMessage();
    };

    const handleOrderTypeSwitch = (type) => {
        setOrderType(type);
        // In MARKET mode price is read-only (set to live price)
        if (type === "MARKET") setStockPrice(stock?.price ?? 0);
        clearMessage();
    };

    const isSell         = activeMode === "SELL";
    const isMarket       = orderType === "MARKET";
    const marginRequired = (Number(stockQty) * Number(stockPrice)).toFixed(2);

    // ── Front-end sell validation ──────────────────────────────────────────────
    const validateSell = (qty) => {
        if (isSell && heldQty > 0 && Number(qty) > heldQty) {
            setMessage({ type: "error", text: `Insufficient quantity. You hold only ${heldQty} unit(s) of ${stock.name}.` });
            return false;
        }
        clearMessage();
        return true;
    };

    const handleQtyChange = (e) => {
        setStockQty(e.target.value);
        if (isSell) validateSell(e.target.value);
        else clearMessage();
    };

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

        // Client-side sell guard — mirrors backend validation for instant feedback
        if (isSell && heldQty > 0 && qty > heldQty) {
            setMessage({ type: "error", text: `Insufficient quantity. You hold only ${heldQty} unit(s) of ${stock.name}.` });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/newOrder`,
                { name: stock.name, qty, price, mode: activeMode },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: "success", text: `${activeMode} order placed successfully!` });
                // Close immediately and pass back the updated holding for instant state patch
                setTimeout(() => {
                    onClose?.();
                    onSuccess?.(response.data.updatedHolding, response.data.fundsAvailable);
                }, 700);
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
    }, [stock, activeMode, stockQty, stockPrice, heldQty, isSell, onClose, onSuccess]);

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    if (!stock) return null;

    return (
        <div className="trade-window-backdrop" onClick={handleBackdropClick}>
            <div className="trade-window" role="dialog" aria-modal="true" aria-label={`Trade ${stock.name}`}>

                {/* ── Header ── */}
                <div className="tw-header">
                    <div className="tw-header-top">
                        <div>
                            <h2 className="tw-stock-name">{stock.name}</h2>
                            <span className="tw-exchange-badge">NSE · Equity</span>
                        </div>
                        <button className="tw-close-btn" onClick={onClose} aria-label="Close">✕</button>
                    </div>

                    {/* BUY / SELL mode tabs */}
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

                {/* ── Body ── */}
                <div className="tw-body">

                    {/* MARKET / LIMIT order type toggle */}
                    <div className="tw-order-type" role="group" aria-label="Order type">
                        <button
                            className={`tw-ot-btn ${isMarket ? "active" : ""}`}
                            onClick={() => handleOrderTypeSwitch("MARKET")}
                        >
                            Market
                        </button>
                        <button
                            className={`tw-ot-btn ${!isMarket ? "active" : ""}`}
                            onClick={() => handleOrderTypeSwitch("LIMIT")}
                        >
                            Limit
                        </button>
                    </div>

                    {/* Held qty info strip (SELL mode only) */}
                    {isSell && heldQty > 0 && (
                        <div className="tw-held-strip">
                            <span className="tw-held-label">Available to sell</span>
                            <span className="tw-held-value">{heldQty} units</span>
                        </div>
                    )}

                    {/* Qty + Price inputs */}
                    <div className="tw-inputs">
                        <fieldset className={`tw-field ${isSell ? "sell-mode" : ""}`}>
                            <legend>Qty.</legend>
                            <input
                                id="tw-qty"
                                type="number"
                                min="1"
                                max={isSell && heldQty > 0 ? heldQty : undefined}
                                value={stockQty}
                                onChange={handleQtyChange}
                            />
                        </fieldset>

                        <fieldset className={`tw-field ${isSell ? "sell-mode" : ""} ${isMarket ? "market-readonly" : ""}`}>
                            <legend>Price (₹) {isMarket && <span className="tw-mkt-tag">MKT</span>}</legend>
                            <input
                                id="tw-price"
                                type="number"
                                min="0.05"
                                step="0.05"
                                value={stockPrice}
                                disabled={isMarket}
                                onChange={(e) => { setStockPrice(e.target.value); clearMessage(); }}
                            />
                        </fieldset>
                    </div>

                    {/* Margin / proceeds strip */}
                    <div className="tw-margin-strip">
                        <span className="tw-margin-label">
                            {isSell ? "Estimated Proceeds" : "Margin Required"}
                        </span>
                        <span className="tw-margin-value">₹{marginRequired}</span>
                    </div>

                    {/* Confirm + Cancel buttons */}
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

                    {/* Inline feedback */}
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
