export default function Apps() {
    const upcomingApps = [
        {
            title: "ZERODHA Mutual Funds",
            description: "Invest in direct mutual funds with zero commission. Set up SIPs in seconds.",
            icon: "📈",
        },
        {
            title: "Options & Futures Pro",
            description: "Advanced options chain, payoff graphs, and strategy builder for F&O traders.",
            icon: "⚡",
        },
        {
            title: "Algo Trading API",
            description: "Connect your Python/Node.js algorithms directly to your ZEROSTOX account.",
            icon: "🤖",
        },
        {
            title: "Tax P&L Engine",
            description: "Automated tax harvesting and ready-to-file reports for your CA.",
            icon: "🧾",
        }
    ];

    return (
        <div className="container-fluid py-4 px-lg-5">
            <div className="text-center mb-5">
                <h2 className="fw-bold" style={{ color: "#387ed1" }}>
                    The ZERODHA Ecosystem
                </h2>
                <p className="text-muted fs-6 mx-auto" style={{ maxWidth: "600px" }}>
                    We are continuously building powerful tools to enhance your trading experience.
                    Here's a sneak peek at what's shipping next.
                </p>
            </div>

            <div className="row justify-content-center g-4">
                {upcomingApps.map((app, index) => (
                    <div className="col-12 col-lg-6 col-xl-5" key={index}>
                        <div
                            className="card h-100 border border-light shadow-sm p-4 rounded-4"
                            style={{ transition: "transform 0.3s", cursor: "pointer", backgroundColor: "#fff" }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <div className="d-flex align-items-center mb-3">
                                <div
                                    className="fs-2 me-3 d-flex justify-content-center align-items-center rounded-circle"
                                    style={{ width: "60px", height: "60px", backgroundColor: "#f8f9fa" }}
                                >
                                    {app.icon}
                                </div>
                                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: "1.25rem" }}>
                                    {app.title}
                                </h4>
                            </div>

                            <p className="text-muted mb-4 flex-grow-1" style={{ fontSize: "1rem", lineHeight: "1.5" }}>
                                {app.description}
                            </p>

                            <div>
                                <button
                                    className="btn btn-light w-100 fw-semibold"
                                    style={{ borderRadius: "8px", pointerEvents: "none" }}
                                >
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-5 p-4 rounded-4 mx-auto" style={{ maxWidth: "700px", backgroundColor: "#f8f9fa", border: "1px dashed #ced4da" }}>
                <h6 className="text-muted mb-0">
                    Want early access? <span style={{ color: "#387ed1", cursor: "pointer", fontWeight: "600" }} onClick={() => alert("Added to waitlist!")}>Join the Beta Waitlist</span>
                </h6>
            </div>
        </div>
    );
}