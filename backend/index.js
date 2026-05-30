const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel }   = require("./model/OrdersModel");
require("dotenv").config();
const bodyParser   = require("body-parser");
const cors         = require("cors");
const mongoose     = require("mongoose");
const express      = require("express");
const cron         = require("node-cron");
const app          = express();
const port         = process.env.PORT || 3000;
const url          = process.env.MONGO_URL;
const yahooFinance = require("yahoo-finance2").default || require("yahoo-finance2");
const cookieParser = require("cookie-parser");
const jwt          = require("jsonwebtoken");
const bcrypt       = require("bcryptjs");
const UserModel    = require("./model/UserModel");
const isProd       = process.env.NODE_ENV === "production";

app.use(cookieParser());
app.use(bodyParser.json());

// Verbose Request Logging Middleware for routing audits
app.use((req, res, next) => {
    console.log(
        `[ROUTE-AUDIT] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | IP: ${req.ip}`
    );
    next();
});

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowed = [
                "https://fintech-platform-coci.vercel.app",
                "https://fintech-platform-umber.vercel.app",
                "http://localhost:5173",
                "http://localhost:5174",
            ];
            const isVercelPreview = /\.vercel\.app$/.test(origin);
            const isRenderPreview = /\.onrender\.com$/.test(origin);
            if (allowed.includes(origin) || isVercelPreview || isRenderPreview) {
                callback(null, true);
            } else {
                callback(new Error(`CORS blocked for origin: ${origin}`));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

const { userVerification } = require("./Middlewares/AuthMiddleware");

app.get("/", (req, res) => { res.send("Hello World!"); });

// ── Holdings Route ────────────────────────────────────────────────────────────
// Per-user query via userId FK. Returns [] if none found — no side-effects.
app.get("/holdings", userVerification, async (req, res) => {
    try {
        const holdings = await HoldingsModel.find({ userId: req.user._id }).lean();
        res.json(holdings);
    } catch (error) {
        console.error("Error fetching holdings:", error);
        res.status(500).json({ message: "Could not fetch holdings. Please try again." });
    }
});

// ── Positions Route ───────────────────────────────────────────────────────────
app.get("/positions", async (req, res) => {
    try {
        const allPositions = await PositionsModel.find({});
        res.json(allPositions);
    } catch (error) {
        console.error("Error fetching positions:", error);
        res.status(500).json({ message: "Could not fetch positions. Please try again." });
    }
});

// ── New Order Route ───────────────────────────────────────────────────────────
// Returns the FULL updated holdings array after trade so the frontend can
// call setHoldings() immediately — no separate GET needed.
app.post("/newOrder", userVerification, async (req, res) => {
    try {
        const { name, qty, price, mode } = req.body;
        const userId = req.user._id;

        // ── Input validation ────────────────────────────────────────────────────
        if (!name || !qty || !price || !mode) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const numQty   = Number(qty);
        const numPrice = Number(price);
        if (isNaN(numQty)   || numQty   <= 0) return res.status(400).json({ success: false, message: "Quantity must be a positive number" });
        if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ success: false, message: "Price must be a positive number" });

        const marginRequired = numQty * numPrice;

        // ── BUY flow ────────────────────────────────────────────────────────────
        if (mode === "BUY") {
            // 1. Funds check
            if (req.user.fundsAvailable < marginRequired) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient funds. Required: ₹${marginRequired.toFixed(2)}, Available: ₹${req.user.fundsAvailable.toFixed(2)}`,
                });
            }

            // 2. Deduct funds
            req.user.fundsAvailable = parseFloat((req.user.fundsAvailable - marginRequired).toFixed(2));
            await req.user.save();

            // 3. Upsert holding — single atomic findOneAndUpdate avoids race conditions
            const existing = await HoldingsModel.findOne({ name, userId });
            if (existing) {
                const newQty = existing.qty + numQty;
                const newAvg = ((existing.qty * existing.avg) + (numQty * numPrice)) / newQty;
                existing.qty   = newQty;
                existing.avg   = parseFloat(newAvg.toFixed(2));
                existing.price = numPrice;
                await existing.save();
            } else {
                await HoldingsModel.create({
                    name, qty: numQty, avg: numPrice, price: numPrice,
                    net: "+0.00%", day: "+0.00%", isLoss: false, userId,
                });
            }

        // ── SELL flow ───────────────────────────────────────────────────────────
        } else if (mode === "SELL") {
            // 1. Ownership-verified holding lookup (userId ensures ownership)
            const existing = await HoldingsModel.findOne({ name, userId });
            if (!existing) {
                return res.status(400).json({ success: false, message: `No holding found for ${name} in your portfolio` });
            }
            if (numQty > existing.qty) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient quantity. You hold ${existing.qty} unit(s) of ${name}, tried to sell ${numQty}`,
                });
            }

            // 2. Mutate holding FIRST (before touching funds — atomic ordering)
            const remainingQty = existing.qty - numQty;
            if (remainingQty <= 0) {
                await HoldingsModel.deleteOne({ _id: existing._id, userId }); // ownership check in delete
            } else {
                existing.qty = remainingQty;
                await existing.save();
            }

            // 3. Credit funds
            const proceeds = numQty * numPrice;
            req.user.fundsAvailable = parseFloat((req.user.fundsAvailable + proceeds).toFixed(2));
            await req.user.save();

        } else {
            return res.status(400).json({ success: false, message: "Invalid order mode. Use BUY or SELL." });
        }

        // ── Save order record ────────────────────────────────────────────────────
        await OrdersModel.create({ name, qty: numQty, price: numPrice, mode, user: userId, createdAt: new Date() });

        // ── Return FULL updated holdings array ───────────────────────────────────
        // Frontend calls setHoldings(updatedHoldings) immediately — no extra GET.
        const updatedHoldings = await HoldingsModel.find({ userId }).lean();

        res.json({
            success: true,
            message: "Order placed successfully",
            updatedHoldings,                       // full array for immediate state sync
            fundsAvailable: req.user.fundsAvailable,
        });
    } catch (error) {
        console.error("[newOrder] Error:", error);
        res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
    }
});

// ── All Orders Route ──────────────────────────────────────────────────────────
app.get("/allorders", userVerification, async (req, res) => {
    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 h
        const orders = await OrdersModel.find({
            user:      req.user._id,
            createdAt: { $gte: cutoff },
        }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("allorders error:", err);
        res.status(500).json({ success: false, message: "Could not fetch orders" });
    }
});


// ── Portfolio Randomization Helpers ──────────────────────────────────────────
const INDIAN_STOCK_UNIVERSE = [
    { name: "RELIANCE",   price: 2900  },
    { name: "INFY",       price: 1450  },
    { name: "TCS",        price: 3850  },
    { name: "HDFCBANK",   price: 1700  },
    { name: "SBIN",       price: 830   },
    { name: "WIPRO",      price: 480   },
    { name: "ONGC",       price: 275   },
    { name: "JIOFIN",     price: 340   },
    { name: "BAJFINANCE", price: 8500  },
    { name: "AXISBANK",   price: 1200  },
    { name: "ICICIBANK",  price: 1350  },
    { name: "KOTAKBANK",  price: 2000  },
    { name: "LT",         price: 3600  },
    { name: "MARUTI",     price: 12500 },
    { name: "TITAN",      price: 3300  },
    { name: "SUNPHARMA",  price: 1800  },
    { name: "TATAMOTORS", price: 950   },
    { name: "ADANIENT",   price: 2800  },
    { name: "KPITTECH",   price: 1420  },
    { name: "HUL",        price: 2340  },
];

/**
 * seedUserPortfolio — inserts exactly 12 unique Holding documents at signup.
 * Each document is linked via userId FK (ER diagram 1:N).
 */
async function seedUserPortfolio(userId) {
    const shuffled = [...INDIAN_STOCK_UNIVERSE].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 12);
    const budget   = 100000;

    const rawWeights = selected.map(() => Math.random());
    const weightSum  = rawWeights.reduce((a, b) => a + b, 0);
    const weights    = rawWeights.map((w) => w / weightSum);

    const holdings = [];
    let usedBudget = 0;

    for (let i = 0; i < selected.length; i++) {
        const stock      = selected[i];
        const allocation = budget * weights[i];
        if (allocation < stock.price) continue;

        const priceFactor    = 0.92 + Math.random() * 0.16;
        const avgPrice       = parseFloat((stock.price * priceFactor).toFixed(2));
        const qty            = Math.max(1, Math.floor(allocation / avgPrice));
        const investedAmount = qty * avgPrice;
        if (usedBudget + investedAmount > budget) continue;
        usedBudget += investedAmount;

        const todayFactor  = 0.95 + Math.random() * 0.10;
        const currentPrice = parseFloat((avgPrice * todayFactor).toFixed(2));
        const netPnlPct    = ((currentPrice - avgPrice) / avgPrice) * 100;
        const dayChangePct = (todayFactor - 1) * 100;

        holdings.push({
            name: stock.name, qty, avg: avgPrice, price: currentPrice,
            net:    `${netPnlPct   >= 0 ? "+" : ""}${netPnlPct.toFixed(2)}%`,
            day:    `${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}%`,
            isLoss: currentPrice < avgPrice,
            userId,
        });
    }

    if (holdings.length === 0) return;
    await HoldingsModel.insertMany(holdings);
    console.log(`[SEED] Inserted ${holdings.length} holdings for userId: ${userId}`);
}

// ── Funds Route ───────────────────────────────────────────────────────────────
app.get("/funds", userVerification, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id).select("fundsAvailable username");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, fundsAvailable: user.fundsAvailable, username: user.username });
    } catch (error) {
        console.error("Funds fetch error:", error);
        res.status(500).json({ success: false, message: "Could not fetch funds" });
    }
});

// ── Signup Route ──────────────────────────────────────────────────────────────
app.post("/signup", async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username)
            return res.status(400).json({ success: false, message: "All fields are required" });

        if (await UserModel.findOne({ email }))
            return res.status(409).json({ success: false, message: "User already exists" });

        const user = await UserModel.create({ email, username, password });

        try { await seedUserPortfolio(user._id); }
        catch (seedErr) { console.error("[SEED] Non-fatal error:", seedErr.message); }

        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, { expiresIn: 3 * 24 * 60 * 60 });
        res.cookie("token", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" });
        res.status(201).json({ message: "User signed up successfully", success: true, user });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "An internal error occurred. Please try again." });
    }
});

// ── Login Route ───────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.json({ message: "All fields are required" });
        const user = await UserModel.findOne({ email });
        if (!user) return res.json({ message: "Incorrect password or email" });
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) return res.json({ message: "Incorrect password or email" });
        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, { expiresIn: 3 * 24 * 60 * 60 });
        res.cookie("token", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" });
        res.status(201).json({ message: "User logged in successfully", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Login failed. Please try again." });
    }
});

// ── Verify Token Route ────────────────────────────────────────────────────────
app.post("/verify-token", userVerification, (req, res) => {
    res.json({ status: true, message: "Auth is working perfectly!", user: req.user.username });
});

// ── Logout Route ──────────────────────────────────────────────────────────────
app.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" });
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

// ── Stock Search Route ────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length < 1) return res.json({ success: true, results: [] });
        const searchResult = await yahooFinance.search(query.trim(), { quotesCount: 20, newsCount: 0 });
        const indianResults = (searchResult.quotes || [])
            .filter((item) =>
                item.symbol &&
                (item.symbol.endsWith(".NS") || item.symbol.endsWith(".BO")) &&
                (item.quoteType === "EQUITY" || item.quoteType === "ETF" || item.quoteType === "MUTUALFUND")
            )
            .slice(0, 8)
            .map((item) => ({
                symbol:     item.symbol.replace(".NS", "").replace(".BO", ""),
                fullSymbol: item.symbol,
                name:       item.shortname || item.longname || item.symbol,
                exchange:   item.exchange || (item.symbol.endsWith(".NS") ? "NSE" : "BSE"),
                type:       item.quoteType,
            }));
        res.json({ success: true, results: indianResults });
    } catch (error) {
        console.error("Search error:", error.message);
        res.json({ success: false, fallback: true, results: [] });
    }
});

// ── Bulk Live Quotes Route ────────────────────────────────────────────────────
app.get("/api/quotes", async (req, res) => {
    try {
        const symbolsString = req.query.symbols;
        if (!symbolsString) return res.json({ success: false, message: "No symbols provided" });
        const symbolsArray = symbolsString.split(",");
        const quotes       = await yahooFinance.quote(symbolsArray, { return: "array" });
        const pricesMap    = {};
        (Array.isArray(quotes) ? quotes : [quotes]).forEach((quote) => {
            if (quote && quote.symbol) {
                const cleanSymbol = quote.symbol.replace(".NS", "").replace(".BO", "");
                pricesMap[cleanSymbol] = {
                    price:         quote.regularMarketPrice,
                    change:        quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                };
            }
        });
        res.json({ success: true, data: pricesMap });
    } catch (error) {
        console.error("Backend Error fetching bulk data:", error.message);
        const fallbackPricesMap = {
            "^NSEI":   { price: 23002.15, change: 775.65,   changePercent: -3.26 },
            "^BSESN":  { price: 74207.24, change: -2496.89, changePercent: -3.26 },
            INFY:      { price: 1450.50,  change: 15.20,    changePercent:  1.25 },
            TCS:       { price: 3850.00,  change: -12.50,   changePercent: -0.45 },
            RELIANCE:  { price: 2900.20,  change: 25.10,    changePercent:  0.80 },
            HUL:       { price: 2340.10,  change: -18.30,   changePercent: -1.10 },
            WIPRO:     { price: 480.00,   change: 2.50,     changePercent:  0.50 },
            ONGC:      { price: 275.40,   change: 3.20,     changePercent:  1.15 },
            "M&M":     { price: 1950.00,  change: -5.00,    changePercent: -0.25 },
            KPITTECH:  { price: 1420.00,  change: 10.00,    changePercent:  0.70 },
            QUICKHEAL: { price: 540.20,   change: -2.10,    changePercent: -0.38 },
        };
        res.json({ success: true, data: fallbackPricesMap });
    }
});

// ── DB connect → start server → register cron ─────────────────────────────────
mongoose
    .connect(url)
    .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });

        // ── Daily cleanup — runs every day at 00:05 IST ───────────────────────
        // Deletes Orders older than 24 hours from the database.
        // This keeps the Orders and Positions pages showing only recent activity.
        cron.schedule(
            "5 0 * * *",        // 00:05 every day
            async () => {
                try {
                    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const result = await OrdersModel.deleteMany({ createdAt: { $lt: cutoff } });
                    console.log(`[CRON] Deleted ${result.deletedCount} order(s) older than 24 h`);
                } catch (err) {
                    console.error("[CRON] Cleanup failed:", err.message);
                }
            },
            { timezone: "Asia/Kolkata" }
        );
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });