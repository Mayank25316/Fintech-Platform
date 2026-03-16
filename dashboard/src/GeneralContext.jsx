import BuyActionWindow from "./BuyActionWindow";
import { createContext, useState, useContext } from "react";

const GeneralContext = createContext({
    openBuyWindow: (uid) => { },
    closeBuyWindow: () => { },
});

export const GeneralContextProvider = ({ children }) => {
    const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
    const [selectedStockUID, setSelectedStockUID] = useState("");

    const handleOpenBuyWindow = (uid) => {
        setIsBuyWindowOpen(true);
        setSelectedStockUID(uid);
    };

    const handleCloseBuyWindow = () => {
        setIsBuyWindowOpen(false);
        setSelectedStockUID("");
    };

    return (
        <GeneralContext
            value={{
                openBuyWindow: handleOpenBuyWindow,
                closeBuyWindow: handleCloseBuyWindow,
            }}
        >
            {children}
            {isBuyWindowOpen && <BuyActionWindow uid={selectedStockUID} />}
        </GeneralContext>
    );
};

export const useGeneralContext = () => useContext(GeneralContext);

export default GeneralContext;