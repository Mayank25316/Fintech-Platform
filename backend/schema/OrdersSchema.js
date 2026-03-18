const {Schema} = require("mongoose");

const OrdersSchema = new Schema({
    name: String,
    qty: Number,
    price: Number,
    mode: String,
    createdAt: {      
    type: Date,
    default: Date.now,
    },
});

module.exports = { OrdersSchema };