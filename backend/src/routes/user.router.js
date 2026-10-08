const express = require("express");
const cookieParser = require("cookie-parser");

const userRouter = express.Router();
userRouter.use(express.json());
userRouter.use(cookieParser());

const User = require("../models/user.model");
const { encryptPassword, validateOldPassword } = require("../utils");
const { userAuth } = require("../middleware/auth.middleware");

userRouter.get("/me", userAuth, async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send("Something went wrong...");
  }
});

userRouter.patch("/update", userAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).send("Bad Request...");
    }
    const ALLOWED_UPDATES = ["name", "avatar", "gender", "age", "bio"];
    const isUpdateAllowed = Object.keys(data).every((k) => {
      return ALLOWED_UPDATES.includes(k);
    });
    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
    }
    const user = await User.findByIdAndUpdate(userId, data, {
      returnDocument: "after",
      runValidators: true, // Will run validator functions while updating as well
    }).select("-password");
    if (!user) {
      return res.status(404).send("User not found!");
    }
    console.log(user);
    res.status(200).send(user);
  } catch (err) {
    console.log("> Error: " + err.message);
    res.status(500).send("Something went wrong...");
  }
});

userRouter.patch("/changePassword", userAuth, async (req, res) => {
  try {
    const oldPasswordHash = req.user.password;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).send("Bad Request...");
    }
    if (!validateOldPassword(oldPassword, oldPasswordHash)) {
      return res.status(400).send("Bad Request...");
    }
    const newPasswordHash = await encryptPassword(newPassword);
    const user = await User.findByIdAndUpdate(req.user._id, {
      password: newPasswordHash,
    }).select("-password");
    console.log(user);
    res.status(200).send(user);
  } catch (err) {
    console.log("> Error: " + err.message);
    res.status(500).send("Something went wrong...");
  }
});

userRouter.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found!");
    }
    console.log(user);
    res.status(200).send(user);
  } catch (err) {
    console.log("> Error: " + err.message);
    // Mongoose throws a specific CastError if the string length/format of the ID is invalid
    if (err.name === "CastError") {
      return res.status(400).send("Something Went wrong");
    }
    res.status(500).send("Something went wrong...");
  }
});

userRouter.get("/users", async (req, res) => {
  const { name, email } = req.query;
  const filter = {};
  if (name) {
    filter.name = { $regex: `^${name}`, $options: "i" };
  }
  if (email) {
    filter.email = email;
  }
  try {
    const users = await User.find(filter).select("-password"); // Excludes Passwords
    if (!users) {
      return res.status(404).send("No User found...");
    }
    res.status(200).send(users);
  } catch (err) {
    console.log("> Error:", err.message);
    res.status(500).send("Something went wrong...");
  }
});

module.exports = userRouter;
