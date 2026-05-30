import {
    createContext,
    useState,
    useContext,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import axios from "axios";
import { useLiveDataContext } from "./LiveDataContext";

/**
 * TradingContext — global state owner for holdings AND funds.
 *
 * Responsibilities:
 *  • Owns `holdings[]`           — source of truth for the portfolio.
 *  • Owns `fundsAvailable`       — real-time cash balance from the backend.
 *  • Derives `totalInvestment`   — sum of (avg × qty) across all holdings.
 *  • Derives `totalCurrentValue` — sum of (livePrice × qty), falls back to stored price.
 *  • Derives `totalPnL`          — totalCurrentValue − totalInvestment.
 *  • Exposes `fetchHoldings()`   — authenticated GET /holdings.
 *  • Exposes `setHoldings()`     — called immediately after /newOrder (zero round-trip).
 *  • Exposes `setFundsAvailable()`— called by GeneralContext after every trade so the
 *                                   Funds/Summary UI reflects the new balance instantly.
 *
 * All consumers (Summary, Holdings, Funds) read from this single context —
 * no duplicate fetches, no stale state.
 */

const TradingContext = createContext({
    holdings:          [],
    fundsAvailable:    100000,
    totalInvestment:   0,
    totalCurrentValue: 0,
    totalPnL:          0,
    pnlPercentage:     0,
    fetchHoldings:     () => {},
    setHoldings:       () => {},
    setFundsAvailable: () => {},
});

export const TradingContextProvider = ({ children }) => {
    const { livePrices } = useLiveDataContext();

    const [holdings,       setHoldings]       = useState([]);
    // Default to 100000 — overwritten immediately once GET /funds resolves.
    // Using null as the "not-yet-fetched" sentinel so we can distinguish
    // "loading" from "the user genuinely has ₹0".
    const [fundsAvailable, setFundsAvailable] = useState(null);

    // ── Fetch holdings (authenticated) ────────────────────────────────────────
    const fetchHoldings = useCallback(async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/holdings`,
                { withCredentials: true }
            );
            setHoldings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("[TradingContext] fetchHoldings error:", err.message);
            setHoldings([]);
        }
    }, []);

    // ── Fetch real-time funds balance (authenticated) ─────────────────────────
    const fetchFunds = useCallback(async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/funds`,
                { withCredentials: true }
            );
            // Backend returns { success, fundsAvailable, username }
            const val = res.data?.fundsAvailable;
            // Guard: if backend returns undefined/null, fall back to 100000
            setFundsAvailable(typeof val === "number" ? val : 100000);
        } catch (err) {
            console.error("[TradingContext] fetchFunds error:", err.message);
            // Don't crash — use the default
            setFundsAvailable((prev) => (prev === null ? 100000 : prev));
        }
    }, []);

    // Initial load — run both fetches in parallel on mount
    useEffect(() => {
        fetchHoldings();
        fetchFunds();
    }, [fetchHoldings, fetchFunds]);

    // ── Derived portfolio metrics (recomputed whenever holdings OR livePrices change)
    // Using useMemo so consumers don't get new object references on unrelated re-renders.
    const { totalInvestment, totalCurrentValue } = useMemo(
        () =>
            holdings.reduce(
                (acc, stock) => {
                    // Prefer live price; fall back to the stored avg price
                    const livePrice = livePrices[stock.name]?.price ?? stock.price;
                    acc.totalInvestment   += (stock.avg   ?? stock.price) * stock.qty;
                    acc.totalCurrentValue += livePrice * stock.qty;
                    return acc;
                },
                { totalInvestment: 0, totalCurrentValue: 0 }
            ),
        [holdings, livePrices]
    );

    const totalPnL      = totalCurrentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

    // Resolved funds: while the fetch is still in-flight (null), default to 100000
    // so the UI never shows NaN or crashes
    const resolvedFunds = fundsAvailable ?? 100000;

    return (
        <TradingContext.Provider
            value={{
                holdings,
                setHoldings,
                fetchHoldings,

                fundsAvailable:    resolvedFunds,
                setFundsAvailable,

                totalInvestment,
                totalCurrentValue,
                totalPnL,
                pnlPercentage,
            }}
        >
            {children}
        </TradingContext.Provider>
    );
};

export const useTradingContext = () => useContext(TradingContext);

export default TradingContext;
