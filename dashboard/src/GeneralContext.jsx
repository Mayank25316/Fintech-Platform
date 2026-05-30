import TradeWindow from "./TradeWindow";
import { createContext, useState, useContext, useCallback } from "react";

const GeneralContext = createContext({
    openTradeWindow:   (stock, mode) => {},
    closeTradeWindow:  () => {},
    holdingsRefreshKey: 0,
});

export const GeneralContextProvider = ({ children }) => {
    const [isTradeWindowOpen,  setIsTradeWindowOpen]  = useState(false);
    // selectedStock = { name, price, qty? }  — qty is the user's currently held qty
    const [selectedStock,      setSelectedStock]       = useState(null);
    const [tradeMode,          setTradeMode]           = useState("BUY");

    // Incrementing this key triggers a re-fetch in Holdings.jsx
    const [holdingsRefreshKey, setHoldingsRefreshKey] = useState(0);

    /**
     * openTradeWindow
     * @param {{ name: string, price: number, qty?: number }} stock
     * @param {"BUY"|"SELL"} mode
     *
     * Passing `qty` from the holdings table lets TradeWindow show
     * the held quantity in SELL mode and enforce the validation.
     */
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
     * Always bumps holdingsRefreshKey to trigger a Holdings re-fetch;
     * the updatedHolding / fundsAvailable are available here for future
     * global-state optimistic patches if a TradingContext is added.
     */
    const handleOrderSuccess = useCallback((_updatedHolding, _fundsAvailable) => {
        setHoldingsRefreshKey((prev) => prev + 1);
    }, []);

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
                    stock={selectedStock}           // includes qty for SELL validation
                    mode={tradeMode}
                    onClose={handleCloseTradeWindow}
                    onSuccess={handleOrderSuccess}  // receives (updatedHolding, fundsAvailable)
                />
            )}
        </GeneralContext>
    );
};

export const useGeneralContext = () => useContext(GeneralContext);

export default GeneralContext;