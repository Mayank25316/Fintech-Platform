const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const url = process.env.MONGO_URL;
const YahooFinanceClass = require('yahoo-finance2').default || require('yahoo-finance2');
const yahooFinance = new YahooFinanceClass();

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("./model/UserModel");

app.use(cookieParser());
app.use(bodyParser.json());

app.use(
    cors({
        origin: [
            "https://fintech-platform-coci.vercel.app",
            "https://fintech-platform-umber.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

const { userVerification } = require("./Middlewares/AuthMiddleware");


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/holdings', userVerification, async (req, res) => {
    try {
        let userHoldings = await HoldingsModel.find({ user: req.userId });
        res.json(userHoldings);
    } catch (error) {
        console.error("Error fetching holdings:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get('/positions', async (req, res) => {
    let allposition = await PositionsModel.find({});
    res.json(allposition);
});

app.post('/newOrder', async (req, res) => {
    try {
        let newOrder = new OrdersModel({
            name: req.body.name,
            qty: req.body.qty,
            price: req.body.price,
            mode: req.body.mode,
            createdAt: new Date(),
        });
        await newOrder.save();

        if (req.body.mode === "BUY") {
            let existingHolding = await HoldingsModel.findOne({ name: req.body.name });

            if (existingHolding) {
                let newQty = existingHolding.qty + Number(req.body.qty);
                let newAvg = ((existingHolding.qty * existingHolding.avg) + (Number(req.body.qty) * Number(req.body.price))) / newQty;

                existingHolding.qty = newQty;
                existingHolding.avg = newAvg;
                await existingHolding.save();
            } else {
                let newHolding = new HoldingsModel({
                    name: req.body.name,
                    qty: req.body.qty,
                    avg: req.body.price,
                    price: req.body.price,
                    net: "+0.00%",
                    day: "+0.00%",
                });
                await newHolding.save();
            }
        }

        res.json({ success: true, message: "Order Saved and Holdings Updated!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
app.get('/allorders', async (req, res) => {
    let allorders = await OrdersModel.find({});
    res.json(allorders);
});

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.json({ message: "User already exists" });
        }
        const user = await UserModel.create({ email, username, password });

        // Token generate karna
        const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, {
            expiresIn: 3 * 24 * 60 * 60, // 3 days
        });

        // Cookie mein token set karna
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
        });

        res.status(201).json({ message: "User signed up successfully", success: true, user });
    } catch (error) {
        console.error(error);
    }
});

// Login Route
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
            secure: true, 
            sameSite: "none",
        });

        res.status(201).json({ message: "User logged in successfully", success: true });
    } catch (error) {
        console.error(error);
    }
});

app.post("/verify-token", userVerification, (req, res) => {
    res.json({
        status: true,
        message: "Auth is working perfectly!",
        user: req.user.username
    });
});

// Bulk Live Quotes Route
app.get("/api/quotes", async (req, res) => {
    try {
        const symbolsString = req.query.symbols;

        if (!symbolsString) {
            return res.json({ success: false, message: "No symbols provided" });
        }

        const symbolsArray = symbolsString.split(',');
        console.log("Fetching Yahoo Data for:", symbolsArray);
        const quotes = await yahooFinance.quote(symbolsArray, { return: 'array' });

        const pricesMap = {};

        const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

        quotesArray.forEach(quote => {
            if (quote && quote.symbol) {
                const cleanSymbol = quote.symbol.replace('.NS', '').replace('.BO', '');
                pricesMap[cleanSymbol] = {
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent
                };
            }
        });

        res.json({ success: true, data: pricesMap });
    } catch (error) {
        console.error("Backend Error fetching bulk data:", error.message);
        const fallbackPricesMap = {
            "^NSEI": { price: 23002.15, change: 775.65, changePercent: -3.26 }, 
            "^BSESN": { price: 74207.24, change: -2496.89, changePercent: -3.26 },
            "INFY": { price: 1450.50, change: 15.20, changePercent: 1.25 },
            "TCS": { price: 3850.00, change: -12.50, changePercent: -0.45 },
            "RELIANCE": { price: 2900.20, change: 25.10, changePercent: 0.80 },
            "HUL": { price: 2340.10, change: -18.30, changePercent: -1.10 },
            "WIPRO": { price: 480.00, change: 2.50, changePercent: 0.50 },
            "ONGC": { price: 275.40, change: 3.20, changePercent: 1.15 },
            "M&M": { price: 1950.00, change: -5.00, changePercent: -0.25 },
            "KPITTECH": { price: 1420.00, change: 10.00, changePercent: 0.70 },
            "QUICKHEAL": { price: 540.20, change: -2.10, changePercent: -0.38 }
        };
        res.json({ success: true, data: fallbackPricesMap });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
    mongoose.connect(url);
});