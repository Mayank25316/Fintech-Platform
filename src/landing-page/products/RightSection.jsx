
export default function RightSection({imgURL, productTitle, productDesc, learnMoreText, learnMore}){
    return(
        <div className="container p-5 mt-1">
            <div className="row  mt-3 d-flex align-items-center">
                <div className="col-6 p-5">
                    <h2 className="mb-3 fs-3">{productTitle}</h2>
                    <p>{productDesc}</p>
                    <div>
                        {learnMore && (<a href={learnMore}>{learnMoreText || "Learn more"} <i className="fa-solid fa-arrow-right"></i></a>)}
                    </div>
                </div>
                <div className="col-6">
                    <img src={imgURL} className="d-block w-100"/>
                </div>
            </div>
        </div>
    );
}