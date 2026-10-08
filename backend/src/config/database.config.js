const mongoose = require("mongoose");
const ENV = require("./env.config");

const connectDB = async () => {
  await mongoose.connect(String(ENV.DB_URL));
};

module.exports = connectDB;
