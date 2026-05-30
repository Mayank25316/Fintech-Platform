import { useEffect, useMemo } from "react";
import axios from "axios";
import { VerticalGraph } from "./VerticalGraph";
import { useLiveDataContext } from "./LiveDataContext";
import { useGeneralContext } from "./GeneralContext";
import { useTradingContext } from "./TradingContext";

/**
 * Holdings — renders the authenticated user's equity portfolio.
 *
 * State source:  TradingContext.holdings  (set on mount + after every trade)
 * Re-fetch path: holdingsRefreshKey bump from GeneralContext → fetchHoldings()
 *
 * Two-path sync ensures the UI is always fresh:
 *  1. Primary: setHoldings(updatedHoldings) immediately after /newOrder response
 *  2. Fallback: GET /holdings re-fetched when holdingsRefreshKey increments
 */
export default function Holdings() {
    const { holdings, setHoldings } = useTradingContext();
    const { livePrices }            = useLiveDataContext();
    const { openTradeWindow, holdingsRefreshKey } = useGeneralContext();

    // ── Safety-net re-fetch triggered by holdingsRefreshKey ───────────────────
    useEffect(() => {
        let cancelled = false;
        const refetch = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/holdings`,
                    { withCredentials: true }
                );
                // Only update state on a clean 200 — never wipe on error
                if (!cancelled) setHoldings(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                const status = err?.response?.status;
                if (status === 404) {
                    console.warn("[Holdings] GET /api/holdings → 404. Backend deploying. Keeping existing state.");
                } else if (status === 401) {
                    console.warn("[Holdings] GET /api/holdings → 401. Session may have expired.");
                } else {
                    console.error("[Holdings] re-fetch error:", err.message);
                    // Preserve existing data — don't wipe to []
                }
            }
        };
        // Only refetch when key > 0 (skip the initial mount — TradingContext already fetches)
        if (holdingsRefreshKey > 0) refetch();
        return () => { cancelled = true; };
    }, [holdingsRefreshKey, setHoldings]);


    // ── Portfolio calculations via .reduce() on live holdings ─────────────────
    const { totalInvestment, totalCurrentValue } = useMemo(() =>
        holdings.reduce(
            (acc, stock) => {
                const livePrice = livePrices[stock.name]?.price ?? stock.price;
                acc.totalInvestment   += stock.avg * stock.qty;
                acc.totalCurrentValue += livePrice * stock.qty;
                return acc;
            },
            { totalInvestment: 0, totalCurrentValue: 0 }
        ),
        [holdings, livePrices]
    );

    const totalPnL      = totalCurrentValue - totalInvestment;
    const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
    const isTotalProfit = totalPnL >= 0;

    // ── Chart data — re-derived whenever holdings or livePrices change ─────────
    const chartData = useMemo(() => ({
        labels: holdings.map((s) => s.name),
        datasets: [
            {
                label:           "Price (₹)",
                data:            holdings.map((s) => livePrices[s.name]?.price ?? s.price),
                backgroundColor: "rgba(222, 20, 87, 0.66)",
                yAxisID:         "y",
            },
            {
                label:           "Qty",
                data:            holdings.map((s) => s.qty),
                backgroundColor: "rgba(26, 132, 232, 0.87)",
                yAxisID:         "y1",
            },
        ],
    }), [holdings, livePrices]);

    // chartKey forces a full Bar remount when the holdings list changes
    // (e.g., a stock is fully sold and its label disappears from the chart)
    const chartKey = holdings.map((s) => `${s.name}:${s.qty}`).join(",");

    // ── Open TradeWindow with current qty pre-filled ───────────────────────────
    const handleStockClick = (stock) => {
        const currentPrice = livePrices[stock.name]?.price ?? stock.price;
        openTradeWindow({ name: stock.name, price: currentPrice, qty: stock.qty }, "BUY");
    };

    return (
        <>
            <h3 className="title">Holdings ({holdings.length})</h3>

            <div className="order-table">
                <table>
                    <thead>
                        <tr>
                            <th>Instrument</th>
                            <th>Qty.</th>
                            <th>Avg. cost</th>
                            <th>LTP</th>
                            <th>Cur. val</th>
                            <th>P&amp;L</th>
                            <th>Net chg.</th>
                            <th>Day chg.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map((stock, index) => {
                            const currentData  = livePrices[stock.name];
                            const currentPrice = currentData?.price ?? stock.price;
                            const dayChange    = currentData
                                ? currentData.changePercent.toFixed(2)
                                : stock.day;

                            const currValue   = currentPrice * stock.qty;
                            const pnl         = currValue - stock.avg * stock.qty;
                            const isProfit    = pnl >= 0;
                            const profitClass = isProfit ? "profit" : "loss";
                            const isDayProfit = currentData ? currentData.changePercent >= 0 : !stock.isLoss;
                            const dayClass    = isDayProfit ? "profit" : "loss";

                            return (
                                <tr key={stock._id ?? index}>
                                    {/* Clickable black stock name opens TradeWindow */}
                                    <td>
                                        <span
                                            id={`holding-${stock.name}`}
                                            style={{ cursor: "pointer", color: "#000000", fontWeight: 600 }}
                                            title={`Click to trade ${stock.name}`}
                                            onClick={() => handleStockClick(stock)}
                                        >
                                            {stock.name}
                                        </span>
                                    </td>
                                    <td>{stock.qty}</td>
                                    <td>{stock.avg.toFixed(2)}</td>
                                    <td>{currentPrice.toFixed(2)}</td>
                                    <td>{currValue.toFixed(2)}</td>
                                    <td className={profitClass}>{pnl.toFixed(2)}</td>
                                    <td className={profitClass}>{stock.net}</td>
                                    <td className={dayClass}>{dayChange}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Portfolio summary stats — computed via .reduce() on live holdings */}
            <div className="row">
                <div className="col">
                    <h5>
                        {totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h5>
                    <p>Total investment</p>
                </div>
                <div className="col">
                    <h5>
                        {totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h5>
                    <p>Current value</p>
                </div>
                <div className="col">
                    <h5
                        className={isTotalProfit ? "profit" : "loss"}
                        style={{ color: isTotalProfit ? "#4caf50" : "#f44336" }}
                    >
                        {totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        ({isTotalProfit ? "+" : ""}{pnlPercentage.toFixed(2)}%)
                    </h5>
                    <p>P&amp;L</p>
                </div>
            </div>

            {/* chartKey forces Bar to re-render when holdings composition changes */}
            <VerticalGraph key={chartKey} data={chartData} />
        </>
    );
}