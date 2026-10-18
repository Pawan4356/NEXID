const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());

const ENV = require("./config/env.config");
const connectDB = require("./config/database.config");

const {
  authRouter,
  userRouter,
  followRouter,
  noteRouter,
  canvasRouter,
  elementRouter,
  commentRouter,
  likeRouter,
  invitationRouter,
  notificationRouter,
} = require("./routes");

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/follow", followRouter);
app.use("/note", noteRouter);
app.use("/canvas", canvasRouter);
app.use("/element", elementRouter);
app.use("/comment", commentRouter);
app.use("/like", likeRouter);
app.use("/invitation", invitationRouter);
app.use("/notification", notificationRouter);

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
