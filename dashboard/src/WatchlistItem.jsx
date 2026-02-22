import { useState } from "react";
import {KeyboardArrowDown, KeyboardArrowUp} from '@mui/icons-material';
import WatchListAction from "./WatchListAction";

export default function WatchlistItem({stock}) {
    const [showWatchList, setShowWatchList] = useState(false);
    const handleMouseEnter = (e) => {
        setShowWatchList(true);
    };
    const handleMouseleave = (e) => {
        setShowWatchList(false);
    };
    return (
        <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseleave}>
            <div className="item">
                <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
                <div className="itemInfo">
                    <span className="percent">{stock.percent}</span>
                    {stock.isDown ? (<KeyboardArrowDown className="down"/>) : (<KeyboardArrowUp className="up"/>)}
                    <span className="price">{stock.price}</span>
                </div>
            </div>
            {showWatchList && <WatchListAction uid={stock.name}/>}
        </li>
    );
}
