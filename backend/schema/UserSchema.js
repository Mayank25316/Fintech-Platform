const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email address is required"],
        unique: true,
    },
    username: {
        type: String,
        required: [true, "Username is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
    // Baseline funding — every new user starts with ₹1,00,000
    fundsAvailable: {
        type: Number,
        default: 100000,
    },
    // NOTE: userHoldings removed — holdings are fully decoupled into the
    // separate 'holding' collection (HoldingsSchema) with userId reference.
    // Fetch via: Holding.find({ userId: <user._id> })
});

// Encrypt password only when it has been newly set or changed
// Guard prevents double-hashing on subsequent saves
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = userSchema;