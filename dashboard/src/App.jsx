import Home from "./Home.jsx";
import {Route, Routes } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/*" element={<Home/>} />
      </Routes>
    </>
  )
}


