import { useState } from "react";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import WatchListAction from "./WatchListAction";

/**
 * WatchlistItem — single row in the Watchlist sidebar.
 * Passes the resolved live price down to WatchListAction so TradeWindow
 * can pre-fill the price field correctly.
 */
export default function WatchlistItem({ stock, liveData }) {
    const [showActions, setShowActions] = useState(false);

    const currentPrice   = liveData ? liveData.price.toFixed(2) : stock.price;
    const currentPercent = liveData ? `${liveData.changePercent.toFixed(2)}%` : stock.percent;
    const isStockDown    = liveData ? liveData.changePercent < 0 : stock.isDown;

    // Resolved numeric price for pre-filling TradeWindow
    const resolvedPrice  = liveData ? liveData.price : Number(stock.price);

    return (
        <li
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="item">
                <p className={isStockDown ? "down" : "up"}>{stock.name}</p>
                <div className="itemInfo">
                    <span className="percent">{currentPercent}</span>
                    {isStockDown
                        ? <KeyboardArrowDown className="down" />
                        : <KeyboardArrowUp   className="up"   />
                    }
                    <span className="price">{currentPrice}</span>
                </div>
            </div>

            {/* Show action buttons on hover, forward live price for TradeWindow */}
            {showActions && (
                <WatchListAction uid={stock.name} livePrice={resolvedPrice} />
            )}
        </li>
    );
}
