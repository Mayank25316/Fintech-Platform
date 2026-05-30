import TradeWindow from "./TradeWindow";
import { createContext, useState, useContext } from "react";

const GeneralContext = createContext({
    openTradeWindow: (stock, mode) => {},
    closeTradeWindow: () => {},
});

export const GeneralContextProvider = ({ children }) => {
    const [isTradeWindowOpen,  setIsTradeWindowOpen]  = useState(false);
    const [selectedStock,      setSelectedStock]       = useState(null);   // { name, price }
    const [tradeMode,          setTradeMode]           = useState("BUY");  // "BUY" | "SELL"
    // Increment this to trigger a Holdings re-fetch after a successful order
    const [holdingsRefreshKey, setHoldingsRefreshKey] = useState(0);

    const handleOpenTradeWindow = (stock, mode = "BUY") => {
        setSelectedStock(stock);
        setTradeMode(mode);
        setIsTradeWindowOpen(true);
    };

    const handleCloseTradeWindow = () => {
        setIsTradeWindowOpen(false);
        setSelectedStock(null);
    };

    // Called by TradeWindow on a successful order → bumps the refresh key
    const handleOrderSuccess = () => {
        setHoldingsRefreshKey((prev) => prev + 1);
    };

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