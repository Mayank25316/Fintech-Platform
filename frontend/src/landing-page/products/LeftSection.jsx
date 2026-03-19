import googlePlayBadge from "../../assets/Media/googlePlayBadge.svg";
import appstoreBadge from "../../assets/Media/appstoreBadge.svg";

export default function LeftSection({imgURL, productTitle, productDesc, tryDemo, tryDemoText, learnMoreText, learnMore, googlePlay, appStore}){
    return(
        <div className="container p-5 mt-5">
            <div className="row ml-5 px-5 mt-4">
                <div className="col-4 ">
                    <img src={imgURL}/>
                </div>
                <div className="col-4"></div>
                <div className="col-4 p-5 px-5">
                    <h2 className="mb-3 fs-3">{productTitle}</h2>
                    <p>{productDesc}</p>
                    <div>
                        {tryDemo && (<a href={tryDemo} style={{marginRight:"25px"}}>{tryDemoText || "Try demo"} <i className="fa-solid fa-arrow-right"></i></a>)}
                        {learnMore && (<a href={learnMore}>{learnMoreText || "Learn more"} <i className="fa-solid fa-arrow-right"></i></a>)}
                    </div>
                    <div className="mt-3">
                        <a href={googlePlay}><img src={googlePlayBadge} style={{marginRight:"25px"}}/></a>
                        <a href={appStore}><img src={appstoreBadge}/></a>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}