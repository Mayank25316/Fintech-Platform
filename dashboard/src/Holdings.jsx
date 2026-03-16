import axios from "axios";
import { useState, useEffect } from "react";
import { VerticalGraph } from "./VerticalGraph";
import { useLiveDataContext } from "./LiveDataContext";

export default function Holdings(){
    const [holdings, setHoldings] = useState([]);
    const { livePrices } = useLiveDataContext();

    useEffect(()=>{
      axios.get("http://localhost:3000/holdings").then((res)=>{
        console.log(res.data);
        setHoldings(res.data);
      })
    },[]);

    let totalInvestment = 0;
  let totalCurrentValue = 0;

  holdings.forEach((stock) => {
    const currentPrice = livePrices[stock.name] ? livePrices[stock.name].price : stock.price;
    totalInvestment += stock.avg * stock.qty;
    totalCurrentValue += currentPrice * stock.qty;
  });

  const totalPnL = totalCurrentValue - totalInvestment;
  const pnlPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  const isTotalProfit = totalPnL >= 0;

    const labels = holdings.map((stock)=>stock.name);
    
    const data = {
        labels,
        datasets: [
            {
                label: 'Stock Price',
                data: holdings.map((stock) => livePrices[stock.name] ? livePrices[stock.name].price : stock.price),
                backgroundColor: 'rgba(222, 20, 87, 0.66)',
                yAxisID: 'y',
            },
            {
                label: 'Stock Qty',
                data: holdings.map((stock) => stock.qty),
                backgroundColor: 'rgba(26, 132, 232, 0.87)',
                yAxisID: 'y1',
            },
        ],
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
            <th>P&L</th>
            <th>Net chg.</th>
            <th>Day chg.</th>
          </tr>
          </thead>
          <tbody>
          {holdings.map((stock, index)=>{
            const currentData = livePrices[stock.name];
              const currentPrice = currentData ? currentData.price : stock.price;
              const dayChange = currentData ? currentData.changePercent.toFixed(2) : stock.day;
              
              const currValue = currentPrice * stock.qty;
              const pnl = currValue - stock.avg * stock.qty;
              const isProfit = pnl >= 0.0;
              const profitClass = isProfit ? "profit" : "loss";
              
              const isDayProfit = currentData ? currentData.changePercent >= 0 : !stock.isLoss;
              const dayClass = isDayProfit ? "profit" : "loss";

            return(
              <tr key={index}>
            <td>{stock.name}</td>
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
          <h5 className={isTotalProfit ? "profit" : "loss"} style={{ color: isTotalProfit ? "#4caf50" : "#f44336" }}>
            {totalPnL.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            ({isTotalProfit ? "+" : ""}{pnlPercentage.toFixed(2)}%)
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data}/>
    </>
  );
}