import { useTradingContext } from "./TradingContext";
import { useAuthContext }    from "./AuthContext";

/**
 * Summary — dashboard home page.
 *
 * Data sources (all from context — zero local fetches):
 *   TradingContext → fundsAvailable, holdings, totalInvestment,
 *                    totalCurrentValue, totalPnL, pnlPercentage
 *   AuthContext    → username (for the greeting)
 *
 * Reactivity:
 *   • Any trade (Buy/Sell) calls GeneralContext.handleOrderSuccess which calls
 *     setHoldings + setFundsAvailable in TradingContext.
 *   • TradingContext recomputes derived values via useMemo on the new holdings.
 *   • Summary re-renders automatically because it reads from the same context.
 *
 * P&L colour:
 *   • Positive → #4caf50 (green)
 *   • Negative → #f44336 (red)
 *   • Zero     → neutral (#555)
 */
export default function Summary() {
    const {
        holdings,
        fundsAvailable,
        totalInvestment,
        totalCurrentValue,
        totalPnL,
        pnlPercentage,
    } = useTradingContext();

    const { username } = useAuthContext();

    // ── Resolved / safe values ─────────────────────────────────────────────────
    // fundsAvailable is guaranteed non-null from TradingContext (defaults 100000)
    // but we guard here too for belt-and-suspenders safety.
    const safeAvailable  = typeof fundsAvailable === "number" ? fundsAvailable : 100000;

    // Used margin = cost basis of current holdings
    const usedMargin = typeof totalInvestment === "number" ? totalInvestment : 0;

    const isTotalProfit  = totalPnL > 0;
    const isBreakEven    = totalPnL === 0;
    const pnlColour      = isTotalProfit ? "#4caf50" : isBreakEven ? "#555" : "#f44336";
    const pnlSign        = isTotalProfit ? "+" : "";

    // ── Helpers ────────────────────────────────────────────────────────────────
    const fmt = (num) =>
        Number(num).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    // Compact formatter for the Equity card (shows "1.00L" instead of "1,00,000.00")
    const fmtCompact = (num) => {
        const n = Number(num);
        if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
        if (n >= 1000)   return `${(n / 1000).toFixed(2)}k`;
        return fmt(n);
    };

    return (
        <>
            {/* ── Greeting ───────────────────────────────────────────────── */}
            <div className="username">
                <h6>Hi, {username ?? "Investor"}! 👋</h6>
                <hr className="divider" />
            </div>

            {/* ── Equity / Funds section ────────────────────────────────── */}
            <div className="section">
                <span>
                    <p>Equity</p>
                </span>

                <div className="data">
                    <div className="first">
                        <h3>{fmtCompact(safeAvailable)}</h3>
                        <p>Margin available</p>
                    </div>
                    <hr />

                    <div className="second">
                        <p>
                            Margins used{" "}
                            <span>₹{fmt(usedMargin)}</span>
                        </p>
                        <p>
                            Opening balance{" "}
                            <span>₹{fmt(safeAvailable + usedMargin)}</span>
                        </p>
                    </div>
                </div>
                <hr className="divider" />
            </div>

            {/* ── Holdings / P&L section ────────────────────────────────── */}
            <div className="section">
                <span>
                    <p>Holdings ({holdings.length})</p>
                </span>

                <div className="data">
                    <div className="first">
                        {/* Dynamic P&L — green for profit, red for loss */}
                        <h3 style={{ color: pnlColour }}>
                            {pnlSign}₹{fmt(totalPnL)}
                            <small style={{ color: pnlColour, fontSize: "0.65em", marginLeft: "6px" }}>
                                ({pnlSign}{pnlPercentage.toFixed(2)}%)
                            </small>
                        </h3>
                        <p>P&amp;L</p>
                    </div>
                    <hr />

                    <div className="second">
                        <p>
                            Current value{" "}
                            <span>₹{fmt(totalCurrentValue)}</span>
                        </p>
                        <p>
                            Investment{" "}
                            <span>₹{fmt(totalInvestment)}</span>
                        </p>
                    </div>
                </div>
                <hr className="divider" />
            </div>
        </>
    );
}