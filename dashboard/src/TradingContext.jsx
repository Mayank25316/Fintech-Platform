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
            // Only update state on a clean 200 response
            setHoldings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            // 404 = route not found (deploy lag) / 401 = token expired
            // In both cases, PRESERVE existing holdings — don't wipe to []
            const status = err?.response?.status;
            if (status === 404) {
                console.warn("[TradingContext] GET /api/holdings → 404. Backend may still be deploying. Keeping existing state.");
            } else if (status === 401) {
                console.warn("[TradingContext] GET /api/holdings → 401. Session expired. Keeping existing state.");
            } else {
                console.error("[TradingContext] fetchHoldings error:", err.message);
                // Only set to [] on a genuine network / server error (5xx) on first load
                setHoldings((prev) => prev.length === 0 ? [] : prev);
            }
        }
    }, []);

    // ── Fetch real-time funds balance (authenticated) ─────────────────────────
    const fetchFunds = useCallback(async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/funds`,
                { withCredentials: true }
            );
            const val = res.data?.fundsAvailable;
            setFundsAvailable(typeof val === "number" ? val : 100000);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
                console.warn("[TradingContext] GET /api/funds → 404. Backend may still be deploying. Keeping existing state.");
            } else if (status === 401) {
                console.warn("[TradingContext] GET /api/funds → 401. Session expired.");
            } else {
                console.error("[TradingContext] fetchFunds error:", err.message);
                // Only initialize to 100000 if we've never received a real value
                setFundsAvailable((prev) => (prev === null ? 100000 : prev));
            }
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
