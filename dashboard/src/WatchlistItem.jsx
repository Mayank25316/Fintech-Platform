import { useState } from "react";
import {KeyboardArrowDown, KeyboardArrowUp} from '@mui/icons-material';
import WatchListAction from "./WatchListAction";

export default function WatchlistItem({stock, liveData}) {
    const [showWatchList, setShowWatchList] = useState(false);
    const handleMouseEnter = (e) => {
        setShowWatchList(true);
    };
    const handleMouseleave = (e) => {
        setShowWatchList(false);
    };

    const currentPrice = liveData ? liveData.price.toFixed(2) : stock.price;
    const currentPercent = liveData ? `${liveData.changePercent.toFixed(2)}%` : stock.percent;
    const isStockDown = liveData ? liveData.changePercent < 0 : stock.isDown;

    return (
        <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseleave}>
            <div className="item">
                <p className={isStockDown ? "down" : "up"}>{stock.name}</p>
                <div className="itemInfo">
                    <span className="percent">{currentPercent}</span>
                    
                    {isStockDown ? (<KeyboardArrowDown className="down"/>) : (<KeyboardArrowUp className="up"/>)}
                    
                    <span className="price">{currentPrice}</span>
                </div>
            </div>
            {showWatchList && <WatchListAction uid={stock.name}/>}
        </li>
    );
}
