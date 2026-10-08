const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());

const ENV = require("./config/env");
const connectDB = require("./config/database");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");

app.use("/auth", authRouter);
app.use("/user", userRouter);

app.use("/", (req, res) => {
  res.send("Home!");
});

connectDB()
  .then(() => {
    console.log("> Database Connected...");
    app.listen(ENV.PORT, () => {
      console.log("> Server started at port: " + ENV.PORT);
    });
  })
  .catch((err) => {
    console.log("> Error connecting Database: " + err.message);
  });
