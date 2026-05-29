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
    // User-specific holdings portfolio directly stored in User document
    userHoldings: {
        type: Array,
        default: [],
    },
});

// Password save hone se pehle encrypt karna
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = userSchema;