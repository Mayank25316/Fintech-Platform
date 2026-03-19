import zerodhaFundhouse from "../../assets/Media/zerodhaFundhouse.png";
import sensibullLogo from "../../assets/Media/sensibullLogo.svg";
import tijori from "../../assets/Media/tijori.svg";
import streakLogo from "../../assets/Media/streakLogo.png";
import smallcaseLogo from "../../assets/Media/smallcaseLogo.png";
import dittoLogo from "../../assets/Media/dittoLogo.png";
import { Link } from "react-router-dom";


export default function Universe(){
    return(
        <div className="container mt-5">
            <div className="row text-center">
                <div className="col-12 p-3 " >
                    <h2 className="mb-4">The Zerodha Universe</h2>
                    <p>Extend your trading and investment experience even further with our partner platforms</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src={zerodhaFundhouse} style={{height:"50px"}}/>
                    <p className="text-muted mt-4 px-5" style={{fontSize:"12px"}}>Our asset management venture that is creating simple and transparent index funds to help you save for your goals.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src={sensibullLogo} style={{height:"50px"}}/>
                    <p className="text-muted mt-4 px-5" style={{fontSize:"12px"}}>Options trading platform that lets you create strategies, analyze positions, and examine data points like open interest, FII/DII, and more.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src={tijori} style={{height:"50px"}}/>
                    <p className="text-muted mt-4 px-5" style={{fontSize:"12px"}}>Investment research platform that offers detailed insights on stocks, sectors, supply chains, and more.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src={streakLogo} style={{height:"50px"}}/>
                    <p className="text-muted mt-4 px-5" style={{fontSize:"12px"}}>Systematic trading platform that allows you to create and backtest strategies without coding.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src={smallcaseLogo} style={{height:"50px"}}/>
                    <p className="text-muted mt-4 px-5" style={{fontSize:"12px"}}>Thematic investing platform that helps you invest in diversified baskets of stocks on ETFs.</p>
                </div>
                <div className="col-4 p-3 mt-5">
                    <img src={dittoLogo} style={{height:"50px"}}/>
                    <p className="text-muted mt-4 px-5" style={{fontSize:"12px"}}>Personalized advice on life and health insurance. No spam and no mis-selling.</p>
                </div>
                <div className="col-12 mt-4">
                    <Link to="/signup" className="btn btn-primary p-2 fs-5" style={{width:"20%",margin : "0 auto"}}>Sign up for free</Link>
                </div>
            </div>
        </div>
    );
}