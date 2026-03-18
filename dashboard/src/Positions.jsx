import axios from "axios";
import { useState, useEffect } from "react";
import { useLiveDataContext } from "./LiveDataContext";

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const { livePrices } = useLiveDataContext();

  useEffect(() => {
    axios.get("http://localhost:3000/allorders", { withCredentials: true })
      .then((res) => {
        const today = new Date().toISOString().split('T')[0];

        const todaysPositions = res.data.filter((order) => {
          if (!order.createdAt) return false; 
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          return orderDate === today;
        });

        setPositions(todaysPositions);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <h3 className="title">Positions ({positions.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((stock, index) => {
              const currentData = livePrices[stock.name];
              const currentPrice = currentData ? currentData.price : stock.price;
              
              const currValue = currentPrice * stock.qty;
              const investmentValue = stock.price * stock.qty;
              const pnl = currValue - investmentValue;
              
              const isProfit = pnl >= 0.0;
              const profitClass = isProfit ? "profit" : "loss";
              
              const dayChange = currentData ? currentData.changePercent.toFixed(2) : "0.00";
              const isDayProfit = currentData ? currentData.changePercent >= 0 : true;
              const dayClass = isDayProfit ? "profit" : "loss";

              return (
                <tr key={index}>
                  <td>CNC</td> 
                  <td>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.price.toFixed(2)}</td>
                  <td>{currentPrice.toFixed(2)}</td>
                  <td className={profitClass}>{pnl.toFixed(2)}</td>
                  <td className={dayClass}>{dayChange}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}