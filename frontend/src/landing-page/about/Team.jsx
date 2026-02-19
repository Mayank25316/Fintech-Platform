import May from "../../assets/Media/May.jpeg";

export default function Team(){
    return(
        <>
            <div className="container">
            <div className="row p-3">
                <h2 className="fs-3 text-center">People</h2>
            </div>
            <div className="row p-3"
                    style={{fontSize:"20px", lineHeight:"1.8", marginBottom:"15px"}}>
                <div className="col-6 p-3 text-center">
                    <img src={May} style={{borderRadius:"100%",width:"65%", height:"365px"}}/>
                    <h5 className="mt-3">Mayank</h5>
                    <p>Web Developer</p>
                </div>
                <div className="col-6 p-3">
                    <p>I’ve always been fascinated by the stock market and how people grow their wealth through investing. As a developer just starting my career, I built this project to see if I could recreate the tools I use every day.</p>
                    <p>I used this project to push my MERN stack skills to the next level. I’m constantly learning and trying out new ideas.</p>
                    <p>There’s nothing better than the feeling of finally solving a tricky bug. Writing code is my zen.</p>
                    <p>Connect on <a href="https://github.com/Mayank25316">Github</a></p>
                </div>
            </div>
        </div>
        </>
    );
}