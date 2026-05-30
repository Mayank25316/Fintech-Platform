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
// yahoo-finance2 v3 requires explicit instantiation — require().default was v2 syntax
const { YahooFinance } = require("yahoo-finance2");
const yahooFinance     = new YahooFinance();
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

// ═══════════════════════════════════════════════════════════════════════════════
//  IN-MEMORY CACHE  — prevents 429 from Yahoo Finance
//
//  Why we get 429:
//    LiveDataContext polls /api/quotes every 5 s  →  12 Yahoo calls/minute/user
//    Yahoo's unofficial API allows only a few calls per minute per server IP.
//
//  Solution — two-layer defence:
//    1. TTL cache  : serve cached data if it is < QUOTE_TTL_MS old.
//                    Default 60 s  →  1 Yahoo call/minute regardless of how many
//                    browser tabs / users poll.
//    2. Stale fallback: if Yahoo returns 429 but we have ANY cached data (even
//                    old), return it so the UI stays functional.
//    3. Static fallback: if cache is empty AND Yahoo fails, return hardcoded map.
// ═══════════════════════════════════════════════════════════════════════════════

const QUOTE_TTL_MS  = 60  * 1000;   // 60 seconds between real Yahoo calls
const SEARCH_TTL_MS = 10  * 60 * 1000; // 10 minutes for search results

// quoteCache  : { [sortedSymbols]: { data: pricesMap, ts: Date.now() } }
// searchCache : { [query]:         { data: results[],  ts: Date.now() } }
const quoteCache  = {};
const searchCache = {};

// Simple per-IP rate limiter for /api/quotes (protects against cold-cache storms)
// Allows MAX_REQ_PER_WINDOW requests per IP per RATE_WINDOW_MS
const RATE_WINDOW_MS      = 60 * 1000;  // 1 minute window
const MAX_REQ_PER_WINDOW  = 4;          // max 4 calls/min/IP when cache is cold
const ipHitMap = {};                    // { [ip]: { count, windowStart } }

function checkRateLimit(ip) {
    const now  = Date.now();
    const hits = ipHitMap[ip];
    if (!hits || now - hits.windowStart > RATE_WINDOW_MS) {
        ipHitMap[ip] = { count: 1, windowStart: now };
        return true;  // allowed
    }
    if (hits.count >= MAX_REQ_PER_WINDOW) return false; // blocked
    hits.count++;
    return true;
}

// Static fallback — always returned when Yahoo is completely unavailable
const STATIC_FALLBACK = {
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


// ── Holdings Route ────────────────────────────────────────────────────────────
// Per-user query via userId FK. Returns [] if none found — no side-effects.
app.get("/api/holdings", userVerification, async (req, res) => {
    try {
        const holdings = await HoldingsModel.find({ userId: req.user._id }).lean();
        res.json(holdings);
    } catch (error) {
        console.error("Error fetching holdings:", error);
        res.status(500).json({ message: "Could not fetch holdings. Please try again." });
    }
});

// ── Positions Route ───────────────────────────────────────────────────────────
app.get("/api/positions", async (req, res) => {
    try {
        const allPositions = await PositionsModel.find({});
        res.json(allPositions);
    } catch (error) {
        console.error("Error fetching positions:", error);
        res.status(500).json({ message: "Could not fetch positions. Please try again." });
    }
});

// ── New Order Route (/api/newOrder) ─────────────────────────────────────────────────
// Returns the FULL updated holdings array after trade so the frontend can
// call setHoldings() immediately — no separate GET needed.
app.post("/api/newOrder", userVerification, async (req, res) => {
    // ── Debug: log incoming request for server-side tracing ──────────────────
    console.log("[newOrder] user  :", req.user ? `${req.user._id} (${req.user.username})` : "MISSING");
    console.log("[newOrder] body  :", req.body);

    try {
        // ── Explicit auth guard (belt-and-suspenders; userVerification already ran) ──
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized — please log in again" });
        }

        const { name, qty, price, mode } = req.body;
        const userId = req.user._id;

        // ── Input validation ────────────────────────────────────────────────────
        if (!name || qty === undefined || price === undefined || !mode) {
            return res.status(400).json({ success: false, message: "Missing required fields: name, qty, price, mode" });
        }
        const numQty   = Number(qty);
        const numPrice = Number(price);
        if (isNaN(numQty)   || numQty   <= 0) return res.status(400).json({ success: false, message: "Quantity must be a positive number" });
        if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ success: false, message: "Price must be a positive number" });
        if (!["BUY", "SELL"].includes(mode))  return res.status(400).json({ success: false, message: "Invalid mode — must be BUY or SELL" });

        const totalCost = parseFloat((numQty * numPrice).toFixed(2));

        // Runtime funds default — handles legacy users created before fundsAvailable
        // was added to the schema (undefined falls back to ₹1,00,000)
        const currentFunds = typeof req.user.fundsAvailable === "number"
            ? req.user.fundsAvailable
            : 100000;

        // ── BUY flow ────────────────────────────────────────────────────────────
        if (mode === "BUY") {
            if (currentFunds < totalCost) {
                return res.status(400).json({
                    success: false,
                    message: `Order failed: insufficient funds. Required ₹${totalCost.toFixed(2)}, available ₹${currentFunds.toFixed(2)}`,
                });
            }

            // Compute new balance in JS using the already-validated currentFunds.
            // Using plain $set avoids Mongoose 9 pipeline-array restrictions.
            const newFunds    = parseFloat((currentFunds - totalCost).toFixed(2));
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $set: { fundsAvailable: newFunds } },
                { new: true }
            );
            if (!updatedUser) {
                return res.status(500).json({ success: false, message: "Order failed: could not update user funds in database" });
            }

            // Upsert holding
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

            // Refresh req.user so the response returns accurate fundsAvailable
            req.user = updatedUser;

        // ── SELL flow ───────────────────────────────────────────────────────────
        } else {
            const existing = await HoldingsModel.findOne({ name, userId });
            if (!existing) {
                return res.status(400).json({ success: false, message: `Order failed: no holding found for ${name} in your portfolio` });
            }
            if (numQty > existing.qty) {
                return res.status(400).json({
                    success: false,
                    message: `Order failed: insufficient quantity. You hold ${existing.qty} unit(s) of ${name}, tried to sell ${numQty}`,
                });
            }

            // Mutate holding FIRST — then credit funds (atomic ordering)
            const remainingQty = existing.qty - numQty;
            if (remainingQty <= 0) {
                await HoldingsModel.deleteOne({ _id: existing._id, userId });
            } else {
                existing.qty = remainingQty;
                await existing.save();
            }

            const proceeds    = parseFloat((numQty * numPrice).toFixed(2));
            // Credit proceeds in JS — no pipeline needed, compatible with Mongoose 9.
            const newFunds    = parseFloat((currentFunds + proceeds).toFixed(2));
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $set: { fundsAvailable: newFunds } },
                { new: true }
            );
            if (!updatedUser) {
                return res.status(500).json({ success: false, message: "Order failed: could not credit proceeds to user account" });
            }
            req.user = updatedUser;
        }

        // ── Save order record ─────────────────────────────────────────────────
        await OrdersModel.create({ name, qty: numQty, price: numPrice, mode, user: userId, createdAt: new Date() });

        // ── Return full updated holdings array ────────────────────────────────
        const updatedHoldings = await HoldingsModel.find({ userId }).lean();

        const newFunds = parseFloat((req.user.fundsAvailable ?? 0).toFixed(2));
        console.log("[newOrder] success — fundsAvailable now:", newFunds);

        res.json({
            success:          true,
            message:          "Order placed successfully",
            updatedHoldings,
            fundsAvailable:   newFunds,
        });
    } catch (error) {
        console.error("[newOrder] Unhandled exception:", error.name, "|", error.message);
        // Never return a bare 500 — always include a human-readable message
        const friendly = error.name === "ValidationError"
            ? `Order failed: validation error — ${Object.values(error.errors).map(e => e.message).join(", ")}`
            : error.name === "MongoServerError" && error.code === 11000
            ? "Order failed: duplicate key conflict in database"
            : `Order failed: ${error.message}`;
        res.status(500).json({ success: false, message: friendly });
    }
});

// ── All Orders Route ──────────────────────────────────────────────────────────
app.get("/api/allorders", userVerification, async (req, res) => {
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
app.get("/api/funds", userVerification, async (req, res) => {
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

        // Explicitly set fundsAvailable — even though the schema default covers new
        // users, being explicit here prevents any migration gap for older schemas.
        const user = await UserModel.create({ email, username, password, fundsAvailable: 100000 });

        // Fire-and-forget — do NOT await so the 201 response is sent instantly.
        // Portfolio seeding runs in the background; failures are logged but never
        // surface to the user (non-critical path).
        seedUserPortfolio(user._id).catch((seedErr) =>
            console.error("[SEED] Non-fatal error:", seedErr.message)
        );

        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, { expiresIn: 3 * 24 * 60 * 60 });
        res.cookie("token", token, { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax" });
        // Return user object so AuthContext.login() can hydrate username immediately
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
        // Return username so the dashboard can hydrate AuthContext instantly
        res.status(201).json({ message: "User logged in successfully", success: true, username: user.username });
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

// ── Stock Search Route — with 10-minute cache ─────────────────────────────────
app.get("/api/search", async (req, res) => {
    try {
        const query = (req.query.q || "").trim();
        if (!query) return res.json({ success: true, results: [] });

        const cacheKey  = query.toLowerCase();
        const cached    = searchCache[cacheKey];
        const now       = Date.now();

        // ── Return cache if fresh ────────────────────────────────────────────
        if (cached && now - cached.ts < SEARCH_TTL_MS) {
            console.log(`[CACHE-HIT] search: "${query}" (age ${Math.round((now - cached.ts) / 1000)}s)`);
            return res.json({ success: true, results: cached.data, cached: true });
        }

        // ── Hit Yahoo Finance ────────────────────────────────────────────────
        const searchResult  = await yahooFinance.search(query, { quotesCount: 20, newsCount: 0 });
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

        // Store in cache
        searchCache[cacheKey] = { data: indianResults, ts: now };
        console.log(`[CACHE-MISS] search: "${query}" — fetched ${indianResults.length} result(s) from Yahoo`);

        res.json({ success: true, results: indianResults });
    } catch (error) {
        const is429 = error?.message?.includes("429") || error?.statusCode === 429;
        console.error(`[Search] ${is429 ? "429 Too Many Requests" : "Error"}: ${error.message}`);
        // Return stale cache on 429 if available
        const cacheKey = (req.query.q || "").trim().toLowerCase();
        const stale    = searchCache[cacheKey];
        if (stale) {
            console.warn("[Search] Serving stale cache as 429 fallback");
            return res.json({ success: true, results: stale.data, stale: true });
        }
        res.json({ success: false, fallback: true, results: [] });
    }
});

// ── Bulk Live Quotes Route — with 60-second TTL cache + 429 fallback ──────────
//
// Flow:
//   1. Cache HIT  (age < 60 s) → return immediately, skip Yahoo
//   2. Cache MISS → check per-IP rate limit → call Yahoo
//   3. Yahoo 429  → return stale cache if available, else STATIC_FALLBACK
//   4. Yahoo OK   → store in cache, return fresh data
//
app.get("/api/quotes", async (req, res) => {
    const symbolsString = req.query.symbols;
    if (!symbolsString) return res.json({ success: false, message: "No symbols provided" });

    // Normalise + sort symbols so "A,B" and "B,A" share the same cache slot
    const symbolsArray = symbolsString.split(",").map(s => s.trim()).filter(Boolean).sort();
    const cacheKey     = symbolsArray.join(",");
    const now          = Date.now();
    const cached       = quoteCache[cacheKey];

    // ── 1. Cache HIT ──────────────────────────────────────────────────────────
    if (cached && now - cached.ts < QUOTE_TTL_MS) {
        const ageS = Math.round((now - cached.ts) / 1000);
        console.log(`[CACHE-HIT] quotes (${symbolsArray.length} symbols, age ${ageS}s)`);
        return res.json({ success: true, data: cached.data, cached: true, ageSeconds: ageS });
    }

    // ── 2. Per-IP rate limit check (only fires when cache is cold) ────────────
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
        console.warn(`[RATE-LIMIT] ${clientIp} exceeded ${MAX_REQ_PER_WINDOW} req/min for /api/quotes`);
        // Return stale cache if we have ANY previous data
        if (cached) {
            const staleAgeS = Math.round((now - cached.ts) / 1000);
            console.warn(`[RATE-LIMIT] Serving stale cache (age ${staleAgeS}s) to ${clientIp}`);
            return res.json({ success: true, data: cached.data, stale: true, ageSeconds: staleAgeS });
        }
        return res.json({ success: true, data: STATIC_FALLBACK, fallback: true });
    }

    // ── 3. Call Yahoo Finance ─────────────────────────────────────────────────
    try {
        console.log(`[CACHE-MISS] quotes — calling Yahoo for ${symbolsArray.length} symbol(s)`);
        const quotes    = await yahooFinance.quote(symbolsArray, { return: "array" });
        const pricesMap = {};
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

        // Store fresh data in cache
        quoteCache[cacheKey] = { data: pricesMap, ts: now };
        console.log(`[CACHE-STORE] ${symbolsArray.length} symbol(s) cached for ${QUOTE_TTL_MS / 1000}s`);

        res.json({ success: true, data: pricesMap });

    } catch (error) {
        // ── 4. Yahoo failed (429, network error, etc.) ────────────────────────
        const is429     = error?.message?.includes("429") || error?.statusCode === 429;
        const errorType = is429 ? "429 Too Many Requests" : error.message;
        console.error(`[Quotes] Yahoo error: ${errorType}`);

        // Prefer stale cache over static fallback (at least the symbols match)
        if (cached) {
            const staleAgeS = Math.round((now - cached.ts) / 1000);
            console.warn(`[Quotes] 429 fallback: returning stale cache (age ${staleAgeS}s)`);
            return res.json({ success: true, data: cached.data, stale: true, ageSeconds: staleAgeS });
        }

        // Last resort: static fallback map
        console.warn("[Quotes] No cache available — returning static fallback");
        res.json({ success: true, data: STATIC_FALLBACK, fallback: true });
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

        // ── Daily midnight cleanup — runs every day at 00:00 IST ─────────────
        // Empties the Orders and Positions collections to give a clean slate
        // for the next trading day.  Each collection is cleared independently
        // so a failure in one does not prevent the other from running.
        cron.schedule(
            "0 0 * * *",          // 00:00 IST exactly (midnight)
            async () => {
                console.log("[CRON] Starting midnight cleanup…");

                // 1. Delete all orders older than 24 h (rolling window)
                try {
                    const cutoff     = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    const ordersDel  = await OrdersModel.deleteMany({ createdAt: { $lt: cutoff } });
                    console.log(`[CRON] Orders cleared: ${ordersDel.deletedCount} document(s) removed`);
                } catch (err) {
                    console.error("[CRON] Orders cleanup failed:", err.message);
                }

                // 2. Clear all positions (intraday slate — reset every night)
                try {
                    const posDel = await PositionsModel.deleteMany({});
                    console.log(`[CRON] Positions cleared: ${posDel.deletedCount} document(s) removed`);
                } catch (err) {
                    console.error("[CRON] Positions cleanup failed:", err.message);
                }

                console.log("[CRON] Midnight cleanup complete.");
            },
            { timezone: "Asia/Kolkata" }
        );
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });