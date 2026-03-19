import { Link } from "react-router-dom";
import { useGeneralContext } from "./GeneralContext";
import "./BuyActionWindow.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { useLiveDataContext } from "./LiveDataContext";

export default function BuyActionWindow({ uid }) {
    const [stockQty, setStockQty] = useState(1);
    const [stockPrice, setStockPrice] = useState(0.0);

    const { closeBuyWindow } = useGeneralContext();
    const { livePrices } = useLiveDataContext();

    useEffect(() => {
        if (uid && livePrices[uid]) {
            setStockPrice(livePrices[uid].price);
        }else {
            setStockPrice(0.00); 
        }
    }, [uid, livePrices]);

    const handleBuyClick = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/newOrder`,
                {
                    name: uid,
                    qty: Number(stockQty), 
                    price: Number(stockPrice), 
                    mode: "BUY",
                },
                { withCredentials: true }
            );

            console.log("Order Response:", response.data);
            closeBuyWindow();
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Check console.");
        }
    };

    const handleCancelClick = () => {
        closeBuyWindow();
    };

    const marginRequired = (stockQty * stockPrice).toFixed(2);

    return (
        <div className="container" id="buy-window" draggable="true">
            <div className="regular-order">
                <div className="inputs">
                    <fieldset>
                        <legend>Qty.</legend>
                        <input type="number" name="qty" id="qty" onChange={(e) => setStockQty(e.target.value)} value={stockQty} />
                    </fieldset>
                    <fieldset>
                        <legend>Price</legend>
                        <input type="number" name="price" id="price" step="0.05" onChange={(e) => setStockPrice(e.target.value)} value={stockPrice} />
                    </fieldset>
                </div>
            </div>

            <div className="buttons">
                <span>Margin Required : {marginRequired}</span>
                <div>
                    <Link className="btn btn-blue" onClick={handleBuyClick}>Buy</Link>
                    <Link className="btn btn-grey" onClick={handleCancelClick}>Cancel</Link>
                </div>
            </div>
        </div>
    );
}