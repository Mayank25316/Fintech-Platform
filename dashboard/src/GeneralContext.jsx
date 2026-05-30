import TradeWindow from "./TradeWindow";
import { createContext, useState, useContext, useCallback } from "react";
import { useTradingContext } from "./TradingContext";

const GeneralContext = createContext({
    openTradeWindow:    (stock, mode) => {},
    closeTradeWindow:   () => {},
    holdingsRefreshKey: 0,
});

export const GeneralContextProvider = ({ children }) => {
    const { setHoldings, setFundsAvailable } = useTradingContext();

    const [isTradeWindowOpen, setIsTradeWindowOpen] = useState(false);
    const [selectedStock,     setSelectedStock]      = useState(null);   // { name, price, qty? }
    const [tradeMode,         setTradeMode]          = useState("BUY");

    /**
     * holdingsRefreshKey is kept for backward-compat so Holdings.jsx still
     * compiles, but the primary sync path is now via TradingContext.setHoldings().
     */
    const [holdingsRefreshKey, setHoldingsRefreshKey] = useState(0);

    const handleOpenTradeWindow = useCallback((stock, mode = "BUY") => {
        setSelectedStock(stock);
        setTradeMode(mode);
        setIsTradeWindowOpen(true);
    }, []);

    const handleCloseTradeWindow = useCallback(() => {
        setIsTradeWindowOpen(false);
        setSelectedStock(null);
    }, []);

    /**
     * handleOrderSuccess
     * Called by TradeWindow after a successful order.
     *
     * Primary path:  setHoldings(updatedHoldings)  — immediate, zero-latency.
     * Fallback path: bump holdingsRefreshKey        — triggers re-fetch in
     *                Holdings.jsx as a safety net (e.g., if updatedHoldings
     *                is somehow missing from the response).
     */
    const handleOrderSuccess = useCallback((updatedHoldings, newFundsAvailable) => {
        if (Array.isArray(updatedHoldings) && updatedHoldings.length >= 0) {
            // Immediate holdings state sync — no extra GET request needed
            setHoldings(updatedHoldings);
        }
        // Sync funds balance immediately so Summary/Funds pages update in real-time
        if (typeof newFundsAvailable === "number") {
            setFundsAvailable(newFundsAvailable);
        }
        // Always bump the key so Holdings.jsx re-fetches as a safety-net
        setHoldingsRefreshKey((prev) => prev + 1);
    }, [setHoldings, setFundsAvailable]);

    return (
        <GeneralContext
            value={{
                openTradeWindow:   handleOpenTradeWindow,
                closeTradeWindow:  handleCloseTradeWindow,
                holdingsRefreshKey,
            }}
        >
            {children}
            {isTradeWindowOpen && selectedStock && (
                <TradeWindow
                    stock={selectedStock}
                    mode={tradeMode}
                    onClose={handleCloseTradeWindow}
                    onSuccess={handleOrderSuccess}
                />
            )}
        </GeneralContext>
    );
};

export const useGeneralContext = () => useContext(GeneralContext);

export default GeneralContext;