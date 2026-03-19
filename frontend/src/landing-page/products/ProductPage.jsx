import Hero from "./Hero";
import LeftSection from "./LeftSection";
import KiteLogo from "../../assets/Media/KiteLogo.png";
import coin from "../../assets/Media/coin.png";
import varsity from "../../assets/Media/varsity.png";
import RightSection from "./RightSection";
import console from "../../assets/Media/console.png";
import Kiteconnect from "../../assets/Media/Kiteconnect.png";
import Universe from "./Universe";

export default function ProductPage(){
    return(
        <>
        <Hero/>
        <LeftSection imgURL={KiteLogo} productTitle="Kite" productDesc="Our ultra-fast flagship trading platform with streaming market data, advanced charts, an elegant UI, and more. Enjoy the Kite experience seamlessly on your Android and iOS devices." tryDemo="https://kite-demo.zerodha.com/dashboard" learnMore="https://zerodha.com/products/kite" googlePlay="" appStore=""/>
        <RightSection imgURL={console} productTitle="Console" productDesc="The central dashboard for your Zerodha account. Gain insights into your trades and investments with in-depth reports and visualisations." learnMore="https://zerodha.com/products/console"/>
        <LeftSection imgURL={coin} productTitle="Coin" productDesc="Buy direct mutual funds online, commission-free, delivered directly to your Demat account. Enjoy the investment experience on your Android and iOS devices." tryDemoText="Coin" tryDemo="https://coin.zerodha.com/" learnMore="" googlePlay="" appStore=""/>
        <RightSection imgURL={Kiteconnect} productTitle="Kite Connect API" productDesc="Build powerful trading platforms and experiences with our super simple HTTP/JSON APIs. If you are a startup, build your investment app and showcase it to our clientbase." learnMore="https://zerodha.com/products/api/"/>
        <LeftSection imgURL={varsity} productTitle="Varsity mobile" productDesc="An easy to grasp, collection of stock market lessons with in-depth coverage and illustrations. Content is broken down into bite-size cards to help you learn on the go." googlePlay="" appStore=""/>
        <p className="text-center fs-4 p-5">Want to know more about our technology stack? Check out the <a href="https://zerodha.tech/">Zerodha.tech</a> blog.</p>
        <Universe/>
        </>
    )
}