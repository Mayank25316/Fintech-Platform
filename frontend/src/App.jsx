import { Routes, Route } from "react-router-dom";
import HomePage from './landing-page/home/HomePage'
import Signup  from './landing-page/signup/Signup';
import ProductPage from './landing-page/products/ProductPage';
import PricingPage from './landing-page/pricing/PricingPage';
import AboutPage from './landing-page/about/AboutPage';
import SupportPage from './landing-page/support/SupportPage';
import Navbar from "./landing-page/Navbar";
import Footer from "./landing-page/Footer";
import NotFound from "./landing-page/NotFound";
import Login from "./landing-page/signup/Login";

function App() {

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/product" element={<ProductPage/>}/>
        <Route path="/pricing" element={<PricingPage/>}/>
        <Route path="/about" element={<AboutPage/>}/>
        <Route path="/support" element={<SupportPage/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
      <Footer/>
    </>
  )
}

export default App
