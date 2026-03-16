const UserModel = require("../model/UserModel");
const jwt = require("jsonwebtoken");

require("dotenv").config();

module.exports.userVerification = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        return res.json({ status: false, message: "No token provided" });
    }

    jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
        if (err) {
            return res.json({ status: false, message: "Token is invalid" });
        } else {
            const user = await UserModel.findById(data.id);
            if (user) {
                req.user = user; 
                next(); 
            } else {
                return res.json({ status: false, message: "User not found" });
            }
        }
    });
};