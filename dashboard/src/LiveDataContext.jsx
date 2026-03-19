import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const LiveDataContext = createContext();

export const LiveDataContextProvider = ({ children }) => {
    const [livePrices, setLivePrices] = useState({});

    useEffect(() => {
        const fetchAllPrices = async () => {
            try {
                const allStocks = ["INFY", "ONGC", "TCS", "KPITTECH", "QUICKHEAL",
                    "WIPRO", "M&M", "RELIANCE", "HUL", "^NSEI", "^BSESN"];

                const symbolsList = allStocks.map(stock => {
                    if (stock.startsWith('^')) return stock;
                    return `${stock}.NS`;
                }).join(',');

                const encodedSymbols = encodeURIComponent(symbolsList);

                if (symbolsList.length > 0) {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/quotes?symbols=${encodedSymbols}`);
                    if (response.data.success) {
                        setLivePrices(response.data.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching live prices", error);
            }
        };

        fetchAllPrices();
        const interval = setInterval(fetchAllPrices, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <LiveDataContext.Provider value={{ livePrices }}>
            {children}
        </LiveDataContext.Provider>
    );
};

export const useLiveDataContext = () => useContext(LiveDataContext);

export default LiveDataContext;