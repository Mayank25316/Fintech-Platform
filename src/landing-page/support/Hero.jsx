export default function Hero() {
    return (
        <section className="hero-section py-4"style={{ backgroundColor: "#F6F6F6" }}>
            <div className="container">
            <div className="row">
                <div className="col-12 d-flex justify-content-between align-items-center p-3">
                    <h1 className="fs-2 mb-1" style={{ color: "#424242" }}>Support Portal</h1>
                    <button className="btn btn-primary px-3">My tickets</button>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <div className="input-group input-group-lg border p-1 rounded bg-white">
                        <span class="input-group-text text-muted border-0 bg-white ps-3"><i className="fa-solid fa-magnifying-glass"></i></span>
                        <input type="text" placeholder="Eg: How do I open my account, How do i activate F&O..."
                            className="form-control text-muted shadow-none border-0"/>
                    </div>
                </div>
            </div>
        </div>
        </section>
    );
}

