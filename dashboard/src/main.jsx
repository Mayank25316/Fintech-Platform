import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { LiveDataContextProvider } from './LiveDataContext.jsx';
import { GeneralContextProvider } from "./GeneralContext";
import { TradingContextProvider } from "./TradingContext";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LiveDataContextProvider>
      <TradingContextProvider>
        <GeneralContextProvider>
          <App />
        </GeneralContextProvider>
      </TradingContextProvider>
    </LiveDataContextProvider>
  </BrowserRouter>,
)
