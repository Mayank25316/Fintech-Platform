import broker from "../../assets/Media/broker.png"

export default function Brokerage(){
    return(
        <div className="container mt-5">
            <div className="row text-center">
                <div className="col-12 p-5">
                    <h2 className="mb-3">Equity</h2>
                    <img src={broker} className="d-block w-100 mb-5" />
                    <h3 className="mt-5 text-muted fs-5"><a href="https://zerodha.com/brokerage-calculator#tab-equities">Calculate your costs upfront</a> using our brokerage calculator</h3>
                </div>
            </div>
        </div>
    );
}