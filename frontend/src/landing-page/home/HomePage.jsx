import Footer from "../Footer";
import Navbar from "../Navbar";
import OpenAccount from "../OpenAccount";
import Education from "./Education";
import Hero from "./Hero";
import Pricing from "./Pricing";
import Stats from "./Stats";

export default function HomePage(){
    return( 
        <>
            <Hero/>
            <Stats/>
            <Pricing/>
            <Education/>
            <OpenAccount/>
        </>
    );
}