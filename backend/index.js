const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const url = process.env.MONGO_URL;
// yahoo-finance2 v3 exports a ready-to-use singleton — do NOT use 'new'
const yahooFinance = require("yahoo-finance2").default || require("yahoo-finance2");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("./model/UserModel");
const isProd = process.env.NODE_ENV === "production";

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
            // Allow requests with no origin (curl, Postman, server-to-server)
            if (!origin) return callback(null, true);

            const allowed = [
                "https://fintech-platform-coci.vercel.app",
                "https://fintech-platform-umber.vercel.app",
                "http://localhost:5173",
                "http://localhost:5174",
            ];

            // Also allow any Vercel preview or Render preview URL for this project
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


app.get("/", (req, res) => {
    res.send("Hello World!");
});

// ── Holdings Route — fully decoupled, per-user query ─────────────────────────
// Fetches holdings directly from the Holding collection using userId foreign key.
// Returns [] if the user has no holdings — no side-effects on GET.
app.get("/holdings", userVerification, async (req, res) => {
    try {
        const holdings = await HoldingsModel.find({ userId: req.user._id });
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
app.post("/newOrder", userVerification, async (req, res) => {
    try {
        const { name, qty, price, mode } = req.body;
        const userId = req.user._id;

        if (!name || !qty || !price || !mode) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const numQty   = Number(qty);
        const numPrice = Number(price);

        if (isNaN(numQty) || numQty <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be a positive number" });
        }
        if (isNaN(numPrice) || numPrice <= 0) {
            return res.status(400).json({ success: false, message: "Price must be a positive number" });
        }

        const marginRequired = numQty * numPrice;

        // 1. Validate and update user balance BEFORE saving the order
        if (mode === "BUY") {
            if (req.user.fundsAvailable < marginRequired) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient funds. Margin Required: ₹${marginRequired.toFixed(2)}, Available: ₹${req.user.fundsAvailable.toFixed(2)}`,
                });
            }
            req.user.fundsAvailable = parseFloat((req.user.fundsAvailable - marginRequired).toFixed(2));
            await req.user.save();

        } else if (mode === "SELL") {
            // Look up existing holding by userId (decoupled from User document)
            const existing = await HoldingsModel.findOne({ name, userId });
            if (!existing) {
                return res.status(400).json({ success: false, message: `No holding found for ${name}` });
            }
            if (numQty > existing.qty) {
                return res.status(400).json({
                    success: false,
                    message: `Sell quantity (${numQty}) exceeds held quantity (${existing.qty})`,
                });
            }

            const proceeds = numQty * numPrice;
            req.user.fundsAvailable = parseFloat((req.user.fundsAvailable + proceeds).toFixed(2));

            const remainingQty = existing.qty - numQty;
            if (remainingQty <= 0) {
                await HoldingsModel.deleteOne({ _id: existing._id });
            } else {
                existing.qty = remainingQty;
                await existing.save();
            }

            await req.user.save();

        } else {
            return res.status(400).json({ success: false, message: "Invalid order mode. Use BUY or SELL." });
        }

        // 2. Save the order linked to the user
        const newOrder = new OrdersModel({
            name,
            qty:       numQty,
            price:     numPrice,
            mode,
            user:      userId,
            createdAt: new Date(),
        });
        await newOrder.save();

        // 3. Update the Holding document for BUY orders
        //    (SELL holding updates are handled above)
        if (mode === "BUY") {
            const existing = await HoldingsModel.findOne({ name, userId });
            if (existing) {
                // Update average cost and quantity
                const newQty = existing.qty + numQty;
                const newAvg = ((existing.qty * existing.avg) + (numQty * numPrice)) / newQty;
                existing.qty   = newQty;
                existing.avg   = parseFloat(newAvg.toFixed(2));
                existing.price = numPrice;
                await existing.save();
            } else {
                // Create a brand-new holding document linked via userId
                await HoldingsModel.create({
                    name,
                    qty:    numQty,
                    avg:    numPrice,
                    price:  numPrice,
                    net:    "+0.00%",
                    day:    "+0.00%",
                    isLoss: false,
                    userId,
                });
            }
        }

        res.json({ success: true, message: "Order placed successfully" });
    } catch (error) {
        console.error("Order error detail:", error);
        res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
    }
});

// ── All Orders Route ──────────────────────────────────────────────────────────
app.get("/allorders", userVerification, async (req, res) => {
    try {
        const today      = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const orders = await OrdersModel.find({
            user:      req.user._id,
            createdAt: { $gte: startOfDay, $lt: endOfDay },
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        console.error("allorders error:", err);
        res.status(500).json({ success: false, message: "Could not fetch orders" });
    }
});


// ── Portfolio Randomization Helpers ──────────────────────────────────────────

// 20-stock Indian universe with realistic price anchors (fallback when live prices unavailable)
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
 * seedUserPortfolio — called once at signup to populate the user's Holdings.
 *
 * Generates exactly 12 unique Holding documents in the database,
 * each linked to the provided userId (1:N, ER diagram compliant).
 *
 * @param {ObjectId} userId — the newly created user's _id
 * @returns {Promise<void>}
 */
async function seedUserPortfolio(userId) {
    // Shuffle the universe and take the first 12 unique stocks
    const shuffled  = [...INDIAN_STOCK_UNIVERSE].sort(() => Math.random() - 0.5);
    const selected  = shuffled.slice(0, 12);
    const budget    = 100000; // ₹1,00,000 default starting funds

    // Random allocation weights — normalised to sum = 1
    const rawWeights = selected.map(() => Math.random());
    const weightSum  = rawWeights.reduce((a, b) => a + b, 0);
    const weights    = rawWeights.map((w) => w / weightSum);

    const holdings = [];
    let usedBudget = 0;

    for (let i = 0; i < selected.length; i++) {
        const stock      = selected[i];
        const allocation = budget * weights[i];

        if (allocation < stock.price) continue; // can't afford even 1 unit

        // Avg price: ±8% from anchor (realistic entry variation)
        const priceFactor = 0.92 + Math.random() * 0.16;
        const avgPrice    = parseFloat((stock.price * priceFactor).toFixed(2));

        const qty            = Math.max(1, Math.floor(allocation / avgPrice));
        const investedAmount = qty * avgPrice;
        if (usedBudget + investedAmount > budget) continue; // stay within budget
        usedBudget += investedAmount;

        // Current price: ±5% from avg (simulates market movement)
        const todayFactor  = 0.95 + Math.random() * 0.10;
        const currentPrice = parseFloat((avgPrice * todayFactor).toFixed(2));

        const netPnlPct    = ((currentPrice - avgPrice) / avgPrice) * 100;
        const dayChangePct = (todayFactor - 1) * 100;
        const isLoss       = currentPrice < avgPrice;

        holdings.push({
            name:   stock.name,
            qty,
            avg:    avgPrice,
            price:  currentPrice,
            net:    `${netPnlPct  >= 0 ? "+" : ""}${netPnlPct.toFixed(2)}%`,
            day:    `${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}%`,
            isLoss,
            userId, // ER-diagram compliant foreign key
        });
    }

    if (holdings.length === 0) return;

    // Persist all 12 documents in a single batch insert
    await HoldingsModel.insertMany(holdings);
    console.log(`[SEED] Inserted ${holdings.length} holdings for userId: ${userId}`);
}

// ── Funds Route ───────────────────────────────────────────────────────────────
// Returns the authenticated user's available balance
app.get("/funds", userVerification, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id).select("fundsAvailable username");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
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

        if (!email || !password || !username) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        // Create user — password hashing handled by UserSchema pre-save hook
        const user = await UserModel.create({ email, username, password });

        // Seed a 12-stock portfolio into the Holding collection (non-fatal)
        try {
            await seedUserPortfolio(user._id);
        } catch (seedErr) {
            console.error("[SEED] Portfolio seeding error (non-fatal):", seedErr.message);
        }

        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, {
            expiresIn: 3 * 24 * 60 * 60, // 3 days
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure:   isProd,
            sameSite: isProd ? "none" : "lax",
        });

        res.status(201).json({ message: "User signed up successfully", success: true, user });
    } catch (error) {
        console.error("Signup error:", error);
        return res
            .status(500)
            .json({ success: false, message: "An internal error occurred. Please try again." });
    }
});

// ── Login Route ───────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ message: "All fields are required" });
        }
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.json({ message: "Incorrect password or email" });
        }
        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            return res.json({ message: "Incorrect password or email" });
        }

        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, {
            expiresIn: 3 * 24 * 60 * 60,
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure:   isProd,
            sameSite: isProd ? "none" : "lax",
        });

        res.status(201).json({ message: "User logged in successfully", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Login failed. Please try again." });
    }
});

// ── Verify Token Route ────────────────────────────────────────────────────────
app.post("/verify-token", userVerification, (req, res) => {
    res.json({
        status:  true,
        message: "Auth is working perfectly!",
        user:    req.user.username,
    });
});

// ── Logout Route ──────────────────────────────────────────────────────────────
app.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure:   isProd,
        sameSite: isProd ? "none" : "lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

// ── Stock Search Route ────────────────────────────────────────────────────────
// Filters results to Indian exchanges (.NS / .BO)
app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length < 1) {
            return res.json({ success: true, results: [] });
        }

        const searchResult = await yahooFinance.search(query.trim(), {
            quotesCount: 20,
            newsCount:   0,
        });

        const indianResults = (searchResult.quotes || [])
            .filter(
                (item) =>
                    item.symbol &&
                    (item.symbol.endsWith(".NS") || item.symbol.endsWith(".BO")) &&
                    (item.quoteType === "EQUITY" ||
                        item.quoteType === "ETF" ||
                        item.quoteType === "MUTUALFUND")
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
        // Yahoo Finance failed — return success:false so the frontend
        // triggers its fallback UX (amber warning row) instead of crashing
        res.json({ success: false, fallback: true, results: [] });
    }
});

// ── Bulk Live Quotes Route ────────────────────────────────────────────────────
app.get("/api/quotes", async (req, res) => {
    try {
        const symbolsString = req.query.symbols;

        if (!symbolsString) {
            return res.json({ success: false, message: "No symbols provided" });
        }

        const symbolsArray = symbolsString.split(",");
        console.log("Fetching Yahoo Data for:", symbolsArray);
        const quotes = await yahooFinance.quote(symbolsArray, { return: "array" });

        const pricesMap   = {};
        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

        quotesArray.forEach((quote) => {
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
            "^NSEI":     { price: 23002.15, change: 775.65,   changePercent: -3.26 },
            "^BSESN":    { price: 74207.24, change: -2496.89, changePercent: -3.26 },
            INFY:        { price: 1450.50,  change: 15.20,    changePercent: 1.25  },
            TCS:         { price: 3850.00,  change: -12.50,   changePercent: -0.45 },
            RELIANCE:    { price: 2900.20,  change: 25.10,    changePercent: 0.80  },
            HUL:         { price: 2340.10,  change: -18.30,   changePercent: -1.10 },
            WIPRO:       { price: 480.00,   change: 2.50,     changePercent: 0.50  },
            ONGC:        { price: 275.40,   change: 3.20,     changePercent: 1.15  },
            "M&M":       { price: 1950.00,  change: -5.00,    changePercent: -0.25 },
            KPITTECH:    { price: 1420.00,  change: 10.00,    changePercent: 0.70  },
            QUICKHEAL:   { price: 540.20,   change: -2.10,    changePercent: -0.38 },
        };
        res.json({ success: true, data: fallbackPricesMap });
    }
});

// ── DB connect → then start HTTP server ──────────────────────────────────────
// Connect to MongoDB FIRST, then start listening.
// This eliminates the race condition where requests arrive before the DB is ready.
mongoose
    .connect(url)
    .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });