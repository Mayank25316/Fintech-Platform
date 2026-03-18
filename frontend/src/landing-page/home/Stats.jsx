import ecosystem from "../../assets/Media/ecosystem.png";
import pressLogos from "../../assets/Media/pressLogos.png"

export default function Stats(){
    return( 
        <div className="container p-5">
            <div className="row">
                <div className="col-6 p-5">
                    <h1 className="fs-2 mb-5">Trust with confidence</h1>
                    <h2 className="fs-4">Customer-first always</h2>
                    <p className="text-muted">That's why 1.6+ crore customers trust Zerodha with ~ ₹6 lakh crores of equity investments, making us India’s largest broker; contributing to 15% of daily retail exchange volumes in India.</p>
                    <h2 className="fs-4">No spam or gimmicks</h2>
                    <p className="text-muted">No gimmicks, spam, "gamification", or annoying push notifications. High quality apps that you use at your pace, the way you like. Our philosophies.</p>
                    <h2 className="fs-4">The Zerodha universe</h2>
                    <p className="text-muted">Not just an app, but a whole ecosystem. Our investments in 30+ fintech startups offer you tailored services specific to your needs.</p>
                    <h2 className="fs-4">Do better with money</h2>
                    <p className="text-muted">With initiatives like Nudge and Kill Switch, we don't just facilitate transactions, but actively help you do better with your money.</p>
                </div>
                <div className="col-6 p-5">
                    <img src={ecosystem} style={{width:"90%"}}/>
                    <div className="text-center">
                        <a href="" className="mx-5">Explore our products <i className="fa-solid fa-arrow-right" style={{color: "#207BE0"}}></i> </a>
                        <a href="">Try Kite demo <i className="fa-solid fa-arrow-right" style={{color: "#207BE0"}}></i></a>
                    </div>
                </div>
            </div>
            <div className="row text-center mt-5">
                <div className="col">
                    <img src={pressLogos} style={{width:"65%"}}/>
                </div>
            </div>
        </div>
    );
}