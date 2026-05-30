const { Schema } = require("mongoose");

// 1:N relationship — each Holding belongs to exactly one User
const HoldingsSchema = new Schema({
    name:   { type: String, required: true },
    qty:    { type: Number, required: true },
    avg:    { type: Number, required: true },
    price:  { type: Number, required: true },
    net:    { type: String, default: "+0.00%" },
    day:    { type: String, default: "+0.00%" },
    isLoss: { type: Boolean, default: false },
    // Foreign key — references UserModel (ER diagram: User 1 → N Holdings)
    userId: {
        type: Schema.Types.ObjectId,
        ref: "UserModel",
        required: true,
        index: true,        // Indexed for fast per-user queries
    },
});

module.exports = { HoldingsSchema };