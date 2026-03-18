import { Link } from "react-router-dom";

export default function OpenAccount(){
    return( 
        <div className="container p-5 mt-3">
            <div className="row text-center d-flex justify-content-md-center">
                <h2 className="mt-3">Open a Zerodha account</h2>
                <p className="fs-5 mb-3 mt-3 text-muted">Modern platforms and apps, ₹0 investments, and flat ₹20 intraday and F&O trades.</p>
                <Link to="/signup" className="btn btn-primary p-2 fs-5 mt-3" style={{width:"20%",margin : "0 auto"}}>Sign up for free</Link>
            </div>
        </div>
    );
}