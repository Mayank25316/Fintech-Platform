import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { LiveDataContextProvider } from './LiveDataContext.jsx';
import { GeneralContextProvider } from "./GeneralContext";


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LiveDataContextProvider>
      <GeneralContextProvider>
        <App />
      </GeneralContextProvider>
    </LiveDataContextProvider>
  </BrowserRouter>,
)
