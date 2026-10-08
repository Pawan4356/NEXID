const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ENV = require("../config/env.config");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Invalid token");
    }
    const _id = jwt.verify(token, ENV.JWT_SECRET_KEY);
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User not found...");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
};

module.exports = userAuth;
