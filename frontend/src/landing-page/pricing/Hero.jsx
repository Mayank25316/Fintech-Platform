import pricing0 from "../../assets/Media/pricing0.svg"
import twenty from "../../assets/Media/twenty.svg";

export default function Hero() {
    return (
        <div className="container">
            <div className="row text-center">
                <div className="col-12 mt-5 mb-5 p-4">
                    <h1 style={{ fontSize: "28px" }}>Charges</h1>
                    <p style={{ fontSize: "20px", marginBottom:"30px" }} className="text-muted">List of all charges and taxes</p>
                </div>
                <div className="col-4 p-4 mb-3">
                    <img src={pricing0} style={{ width: "250px" }} className="mb-3"/>
                    <h2 className="mb-3">Free equity delivery</h2>
                    <p className="text-muted px-3" style={{ fontSize: "16px" }}>All equity delivery investments (NSE, BSE), are absolutely free — ₹ 0 brokerage.</p>
                </div>
                <div className="col-4 p-4 mb-3">
                    <img src={twenty} style={{ width: "250px" }} className="mb-3"/>
                    <h2 className="mb-3">Intraday and F&O trades</h2>
                    <p className="text-muted px-3" style={{ fontSize: "16px" }}>Flat ₹ 20 or 0.03% (whichever is lower) per executed order on intraday trades across equity, currency, and commodity trades. Flat ₹20 on all option trades.</p>
                </div>
                <div className="col-4 p-4 mb-3">
                    <img src={pricing0} style={{ width: "250px" }} className="mb-3"/>
                    <h2 className="mb-3">Free direct MF</h2>
                    <p className="text-muted px-3" style={{ fontSize: "16px" }}>All direct mutual fund investments are absolutely free — ₹ 0 commissions & DP charges.</p>
                </div>
            </div>
        </div>
    );
}