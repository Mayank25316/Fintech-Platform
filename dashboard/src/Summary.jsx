import { useState, useEffect } from "react";
import axios from "axios";
import { useLiveDataContext } from "./LiveDataContext";

export default function Summary() {
  const [holdings, setHoldings] = useState([]);
  const { livePrices } = useLiveDataContext();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/holdings`).then((res) => {
      setHoldings(res.data);
    });
  }, []);

  let totalInvestment = 0;
  let totalCurrentValue = 0;

  if (Array.isArray(holdings)){
    holdings.forEach((stock) => {
      const currentPrice = livePrices[stock.name] ? livePrices[stock.name].price : stock.price;
      totalInvestment += stock.avg * stock.qty;
      totalCurrentValue += currentPrice * stock.qty;
    });
  }

  const totalPnL = totalCurrentValue - totalInvestment;
  const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  const isTotalProfit = totalPnL >= 0;

  return (
    <>
      <div className="username">
        <h6>Hi, Investor!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>3.74k</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Margins used <span>0</span>{" "}
            </p>
            <p>
              Opening balance <span>3.74k</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({holdings.length})</p>
        </span>

        <div className="data">
          <div className="first">
            {/* Dynamic P&L */}
            <h3 className={isTotalProfit ? "profit" : "loss"} style={{ color: isTotalProfit ? "#4caf50" : "#f44336" }}>
              ₹{totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <small style={{ color: isTotalProfit ? "#4caf50" : "#f44336" }}>
                {" "}{isTotalProfit ? "+" : ""}{pnlPercentage.toFixed(2)}%
              </small>{" "}
            </h3>
            <p>P&L</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Current Value <span>₹{totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>{" "}
            </p>
            <p>
              Investment <span>₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
}