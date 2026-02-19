import pricing0 from "../../assets/Media/pricing0.svg"
import twenty from "../../assets/Media/twenty.svg";


export default function Pricing(){
    return( 
        <div className="container mt-5 p-5">
            <div className="row mb-5">
                <div className="col-6">
                    <h1 className="mb-4 fs-2">Unbeatable pricing</h1>
                    <p>We pioneered the concept of discount broking and price <br></br>transparency in India. Flat fees and no hidden charges.</p>
                    <a href="">See pricing <i className="fa-solid fa-arrow-right" style={{color: "#207BE0"}}></i></a>
                </div>
                <div className="col-6">
                    <div className="row mt-3">
                        <div className="col-4 d-flex align-items-center mb-3">
                            <img src={pricing0} style={{width:"75%"}}/>
                            <p className="text-muted small m-0" style={{ fontSize: "12px" }}>Free account opening</p>
                        </div>
                        <div className="col-4 d-flex align-items-center mb-3">
                            <img src={pricing0} style={{width:"75%"}}/>
                            <p className="text-muted small m-0" style={{ fontSize: "12px" }}> Free equity delivery</p>
                        </div>
                        <div className="col-4 d-flex align-items-center mb-3">
                            <img src={twenty} style={{width:"75%"}}/>
                            <p className="text-muted small m-0" style={{ fontSize: "12px" }}> Intraday and F&O</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}