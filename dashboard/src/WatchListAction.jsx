import { BarChartOutlined, MoreHoriz } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useGeneralContext } from "./GeneralContext";

/**
 * WatchListAction — hover action bar for each watchlist item.
 * uid      — stock name/symbol (e.g. "INFY")
 * livePrice — current live price from LiveDataContext (used to pre-fill TradeWindow)
 */
export default function WatchListAction({ uid, livePrice }) {
    const { openTradeWindow } = useGeneralContext();

    const stock = { name: uid, price: livePrice ?? 0 };

    return (
        <span className="actions">
            <span>
                <Tooltip title="Buy (B)" placement="top" arrow>
                    <button
                        id={`watchlist-buy-${uid}`}
                        className="buy"
                        onClick={() => openTradeWindow(stock, "BUY")}
                    >
                        Buy
                    </button>
                </Tooltip>
                <Tooltip title="Sell (S)" placement="top" arrow>
                    <button
                        id={`watchlist-sell-${uid}`}
                        className="sell"
                        onClick={() => openTradeWindow(stock, "SELL")}
                    >
                        Sell
                    </button>
                </Tooltip>
                <Tooltip title="Analytics (A)" placement="top" arrow>
                    <button className="action">
                        <BarChartOutlined className="icon" />
                    </button>
                </Tooltip>
                <Tooltip title="More" placement="top" arrow>
                    <button className="action">
                        <MoreHoriz className="icon" />
                    </button>
                </Tooltip>
            </span>
        </span>
    );
}
