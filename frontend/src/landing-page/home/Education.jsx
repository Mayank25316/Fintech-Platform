import education from "../../assets/Media/education.svg";

export default function Education(){
    return( 
        <div className="container mt-5 p-5 d-flex align-item-center">
            <div className="row">
                <div className="col-6">
                    <img src={education} style={{width:"65%"}}/>
                </div>
                <div className="col-6">
                    <h1 className="fs-2 mb-5">Free and open market education</h1>
                    <p>Varsity, the largest online stock market education book in the world covering everything from the basics to advanced trading.</p>
                    <a href="">Varsity <i className="fa-solid fa-arrow-right" style={{color: "#207BE0"}}></i></a>
                    <p className="mt-5">TradingQ&A, the most active trading and investment community in India for all your market related queries.</p>
                    <a href="">TradingQ&A <i className="fa-solid fa-arrow-right" style={{color: "#207BE0"}}></i></a>
                </div>
            </div>
        </div>
    );
}

