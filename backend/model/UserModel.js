const mongoose = require("mongoose");
const userSchema = require("../schema/UserSchema");

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;