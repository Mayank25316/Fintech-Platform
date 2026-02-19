import homeHero from "../../assets/Media/homeHero.png";
export default function Hero(){
    return( 
        <div className="container p-5 mb-3 mt-5">
            <div className="row text-center d-flex justify-content-md-center">
                <img src={homeHero} alt="Hero Image" style={{maxWidth:"70%"}} className="mb-5"/>
                <h2 className="mt-3">Invest in everything</h2>
                <p className="fs-5 mb-5">Online platform to invest in stocks, derivatives, mutual funds, ETFs, bonds, and more.</p>
                <button className="btn btn-primary p-2 fs-5" style={{width:"20%",margin : "0 auto"}}>Sign up for free</button>
            </div>
        </div>
    );
}