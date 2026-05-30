import { Link } from "react-router-dom";
import { useTradingContext } from "./TradingContext";

/**
 * Funds — real-time funds & margin page.
 *
 * Data source: TradingContext
 *   • fundsAvailable  — real cash balance from the backend (updated after every trade)
 *   • totalInvestment — used margin (cost basis of current holdings)
 *
 * No local state, no local fetch — TradingContext is the single source of truth.
 * Re-renders automatically whenever fundsAvailable or holdings change post-trade.
 */
export default function Funds() {
    const { fundsAvailable, totalInvestment } = useTradingContext();

    // Guard: both values are guaranteed non-NaN from TradingContext, but we
    // add Number() coercion as a belt-and-suspenders safety measure.
    const safeAvailable  = typeof fundsAvailable === "number" ? fundsAvailable : 100000;
    const usedMargin     = typeof totalInvestment === "number" ? totalInvestment : 0;
    // Opening balance = current cash + cost of current holdings
    const openingBalance = safeAvailable + usedMargin;

    const fmt = (amount) =>
        Number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <>
            <div className="funds">
                <p>Instant, zero-cost fund transfers with UPI</p>
                {/* Replace alert() with title tooltip — non-intrusive feedback */}
                <Link
                    className="btn btn-green"
                    title="Payment Gateway (Razorpay/Stripe) integration coming soon!"
                    onClick={(e) => e.preventDefault()}
                >
                    Add funds
                </Link>
                <Link
                    className="btn btn-blue text-center"
                    title="Withdrawal processing system coming soon!"
                    onClick={(e) => e.preventDefault()}
                >
                    Withdraw
                </Link>
            </div>

            <div className="row">
                <div className="col">
                    <span>
                        <p>Equity</p>
                    </span>

                    <div className="table">
                        <div className="data">
                            <p>Available margin</p>
                            <p className="imp colored">₹{fmt(safeAvailable)}</p>
                        </div>
                        <div className="data">
                            <p>Used margin</p>
                            <p className="imp">₹{fmt(usedMargin)}</p>
                        </div>
                        <div className="data">
                            <p>Available cash</p>
                            <p className="imp">₹{fmt(safeAvailable)}</p>
                        </div>
                        <hr />
                        <div className="data">
                            <p>Opening Balance</p>
                            <p>₹{fmt(openingBalance)}</p>
                        </div>
                        <div className="data">
                            <p>Payin</p>
                            <p>0.00</p>
                        </div>
                        <div className="data">
                            <p>SPAN</p>
                            <p>0.00</p>
                        </div>
                        <div className="data">
                            <p>Delivery margin</p>
                            <p>0.00</p>
                        </div>
                        <div className="data">
                            <p>Exposure</p>
                            <p>0.00</p>
                        </div>
                        <div className="data">
                            <p>Options premium</p>
                            <p>0.00</p>
                        </div>
                        <hr />
                        <div className="data">
                            <p>Collateral (Liquid funds)</p>
                            <p>0.00</p>
                        </div>
                        <div className="data">
                            <p>Collateral (Equity)</p>
                            <p>0.00</p>
                        </div>
                        <div className="data">
                            <p>Total Collateral</p>
                            <p>0.00</p>
                        </div>
                    </div>
                </div>

                <div className="col">
                    <div className="commodity">
                        <p>You don't have a commodity account</p>
                        <a className="btn btn-blue" href="https://zerodha.com/commodities/">
                            Open Account
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}