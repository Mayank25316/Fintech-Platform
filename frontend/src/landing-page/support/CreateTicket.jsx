export default function SupportPage() {
    // Data for the Accordion (Left Side)
    const menuItems = [
        {
            title: "Account Opening",
            iconClass: "fa-solid fa-circle-plus",
            links: ["Resident individual", "Minor", "Non Resident Indian (NRI)", "Company, Partnership, HUF and LLP", "Glossary"]
        },
        {
            title: "Your Zerodha Account",
            iconClass: "fa-regular fa-user",
            links: ["Your Profile", "Account modification", "Client Master Report (CMR) and Depository Participant (DP)", "Nomination", "Transfer and conversion of securities"]
        },
        {
            title: "Kite",
            iconClass: "fa-brands fa-korvue",
            links: ["IPO", "Trading FAQs", "Margin Trading Facility (MTF) and Margins", "Charts and orders", "Alerts and Nudges", "General"]
        },
        {
            title: "Funds",
            iconClass: "fa-solid fa-indian-rupee-sign",
            links: ["Add money", "Withdraw money", "Add bank accounts", "eMandates"]
        },
        {
            title: "Console",
            iconClass: "fa-solid fa-circle-notch",
            links: ["Portfolio", "Corporate actions", "Funds statement", "Reports", "Profile", "Segments"]
        },
        {
            title: "Coin",
            iconClass: "fa-solid fa-indian-rupee-sign",
            links: ["Mutual funds", "National Pension Scheme (NPS)", "Fixed Deposit (FD)", "Features on Coin", "Payments and Orders", "General"]
        }
    ];

    // Data for the Quick Links (Right Side)
    const quickLinks = [
        "Track account opening",
        "Track segment activation",
        "Intraday margins",
        "Kite user manual",
        "Learn how to create a ticket"
    ];

    // Data for the Notice Box (Right Side)
    const noticeLinks = [
        "Change in mutual fund settlement cycle due to settlement holiday on account of Chhatrapati Shivaji Maharaj Jayanti on February 19, 2026",
        "Latest Intraday leverages and Square-off timings"
    ];

    return (
        <div className="container my-5">
            <div className="row">
                {/* ================= LEFT COLUMN: ACCORDION ================= */}
                <div className="col-lg-8 mb-4 mb-lg-0">
                    <div className="accordion" id="supportAccordion">
                        {menuItems.map((item, index) => {
                            const headerId = `heading${index}`;
                            const collapseId = `collapse${index}`;
                            const isFirstItem = index === 0;

                            return (
                                <div
                                    className="accordion-item mb-3 border rounded shadow-sm overflow-hidden"
                                    key={index}
                                    style={{ border: '1px solid #e0e0e0' }}
                                >
                                    <h2 className="accordion-header" id={headerId}>
                                        <button
                                            className={`accordion-button ${!isFirstItem ? 'collapsed' : ''} bg-white`}
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#${collapseId}`}
                                            aria-expanded={isFirstItem}
                                            aria-controls={collapseId}
                                            style={{ boxShadow: 'none' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="me-3 d-flex justify-content-center align-items-center"
                                                    style={{ width: '30px', height: '30px' }}>
                                                    <i className={`${item.iconClass} text-primary`} style={{ fontSize: "1.2rem" }}></i>
                                                </div>
                                                <span style={{ fontSize: "1.05rem", color: "#444" }}>{item.title}</span>
                                            </div>
                                        </button>
                                    </h2>
                                    <div
                                        id={collapseId}
                                        className={`accordion-collapse collapse ${isFirstItem ? 'show' : ''}`}
                                        aria-labelledby={headerId}
                                        data-bs-parent="#supportAccordion"
                                    >
                                        <div className="accordion-body border-top pt-3 pb-3">
                                            <ul className="list-unstyled ms-5 mb-0">
                                                {item.links.map((link, linkIndex) => (
                                                    <li key={linkIndex} className="mb-2">
                                                        <a href="#" className="text-decoration-none" style={{ color: "#387ed1", fontSize: "0.9rem" }}>
                                                            {link}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ================= RIGHT COLUMN: SIDEBAR ================= */}
                <div className="col-lg-4">
                    {/* 1. Yellow Notice Box */}
                    <div className="p-3 mb-4 rounded-1" style={{ backgroundColor: '#fff3e0', borderLeft: '5px solid #ff9800' }}>
                        <ul className="mb-0 ps-3" style={{ listStyleType: 'disc' }}>
                            {noticeLinks.map((link, index) => (
                                <li key={index} className={`mb-2 ${index === noticeLinks.length - 1 ? 'mb-0' : ''}`}>
                                    <a href="#" className="text-decoration-none text-decoration-underline-hover" style={{ color: "#387ed1", fontSize: "0.95rem" }}>
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 2. Quick Links Box (UPDATED to match screenshot) */}
                    <div className="card rounded-1 border overflow-hidden">
                        {/* Header Area */}
                        <div className="card-header border-bottom py-3 px-3" style={{ backgroundColor: "#f9f9f9" }}>
                            <h5 className="mb-0 fw-normal text-dark" style={{ fontSize: "1rem" }}>Quick links</h5>
                        </div>
                        
                        {/* Links List */}
                        <div className="list-group list-group-flush">
                            {quickLinks.map((link, index) => (
                                <a 
                                    key={index}
                                    href="#" 
                                    className="list-group-item list-group-item-action border-bottom py-3 px-3 text-decoration-none"
                                    style={{ color: "#387ed1", fontSize: "0.95rem" }}
                                >
                                    {index + 1}. {link}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}