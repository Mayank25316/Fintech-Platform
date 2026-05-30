const {Schema} = require("mongoose");

const OrdersSchema = new Schema({
    name: String,
    qty: Number,
    price: Number,
    mode: String,
    createdAt: {      
    type: Date,
    default: Date.now,
    user: {
    type: Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
    }
    },
});

module.exports = { OrdersSchema };