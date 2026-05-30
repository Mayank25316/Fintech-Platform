import { createContext, useState, useContext, useCallback, useEffect } from "react";
import axios from "axios";

/**
 * TradingContext — global state owner for holdings.
 *
 * Responsibilities:
 *  • Owns the `holdings` array (source of truth).
 *  • Exposes `fetchHoldings()` — authenticated GET /holdings.
 *  • Exposes `setHoldings()` — called immediately after a trade with the
 *    `updatedHoldings` array returned by POST /newOrder (zero extra round-trip).
 *
 * Any component that needs holdings should consume this context instead of
 * making its own fetch. This prevents duplicate requests and ensures
 * Holdings.jsx, Portfolio stats, and the chart all react to the same state.
 */

const TradingContext = createContext({
    holdings:      [],
    fetchHoldings: () => {},
    setHoldings:   () => {},
});

export const TradingContextProvider = ({ children }) => {
    const [holdings, setHoldings] = useState([]);

    const fetchHoldings = useCallback(async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/holdings`,
                { withCredentials: true }
            );
            setHoldings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("[TradingContext] fetchHoldings error:", err);
            setHoldings([]);
        }
    }, []);

    // Initial load on mount
    useEffect(() => {
        fetchHoldings();
    }, [fetchHoldings]);

    return (
        <TradingContext.Provider value={{ holdings, setHoldings, fetchHoldings }}>
            {children}
        </TradingContext.Provider>
    );
};

export const useTradingContext = () => useContext(TradingContext);

export default TradingContext;
