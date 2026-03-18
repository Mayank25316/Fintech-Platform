import { useLiveDataContext } from "./LiveDataContext";
import Menu from "./Menu";

export default function TopBar(){
const { livePrices } = useLiveDataContext();

  const niftyData = livePrices["^NSEI"] || { price: 0, changePercent: 0 };
  const sensexData = livePrices["^BSESN"] || { price: 0, changePercent: 0 };

  const isNiftyUp = niftyData.changePercent >= 0;
  const isSensexUp = sensexData.changePercent >= 0;

  return (
    <div className="topbar-container">
      <div className="indices-container">
        
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className={`index-points ${isNiftyUp ? "profit" : "loss"}`} style={{ color: isNiftyUp ? "#4caf50" : "#f44336" }}>
            {niftyData.price ? niftyData.price.toLocaleString("en-IN") : "0.00"}
          </p>
          <p className={`percent ${isNiftyUp ? "profit" : "loss"}`} style={{ color: isNiftyUp ? "#4caf50" : "#f44336", fontSize: "0.8rem", marginLeft: "8px" }}>
            {niftyData.changePercent ? `${isNiftyUp ? "+" : ""}${niftyData.changePercent.toFixed(2)}%` : ""}
          </p>
        </div>
        
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className={`index-points ${isSensexUp ? "profit" : "loss"}`} style={{ color: isSensexUp ? "#4caf50" : "#f44336" }}>
            {sensexData.price ? sensexData.price.toLocaleString("en-IN") : "0.00"}
          </p>
          <p className={`percent ${isSensexUp ? "profit" : "loss"}`} style={{ color: isSensexUp ? "#4caf50" : "#f44336", fontSize: "0.8rem", marginLeft: "8px" }}>
            {sensexData.changePercent ? `${isSensexUp ? "+" : ""}${sensexData.changePercent.toFixed(2)}%` : ""}
          </p>
        </div>
      </div>
      <Menu />
    </div>
  );
}
