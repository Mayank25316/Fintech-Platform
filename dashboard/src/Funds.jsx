import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Funds() {
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/holdings", { withCredentials: true })
      .then((res) => {
        setHoldings(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  const openingBalance = 100000.00;

  let usedMargin = 0;
  holdings.forEach((stock) => {
    usedMargin += stock.avg * stock.qty;
  });

  const availableMargin = openingBalance - usedMargin;

  const formatCurrency = (amount) => {
    return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <div className="funds">
        <p>Instant, zero-cost fund transfers with UPI </p>
        <Link className="btn btn-green" onClick={() => alert("Payment Gateway (Razorpay/Stripe) integration coming soon!")}>Add funds</Link>
        <Link className="btn btn-blue text-center" onClick={() => alert("Withdrawal processing system coming soon!")}>Withdraw</Link>
      </div>

      <div className="row">
        <div className="col">
          <span>
            <p>Equity</p>
          </span>

          <div className="table">
            <div className="data">
              <p>Available margin</p>
              <p className="imp colored">₹{formatCurrency(availableMargin)}</p>
            </div>
            <div className="data">
              <p>Used margin</p>
              <p className="imp">₹{formatCurrency(usedMargin)}</p>
            </div>
            <div className="data">
              <p>Available cash</p>
              <p className="imp">₹{formatCurrency(availableMargin)}</p>
            </div>
            <hr />
            <div className="data">
              <p>Opening Balance</p>
              <p>₹{formatCurrency(openingBalance)}</p>
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
            <a className="btn btn-blue" href="https://zerodha.com/commodities/">Open Account</a>
          </div>
        </div>
      </div>
    </>
  );
}