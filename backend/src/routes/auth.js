const express = require("express");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

const authRouter = express.Router();
authRouter.use(express.json());
authRouter.use(cookieParser());

const ENV = require("../config/env");
const User = require("../models/user");
const {
  validateSignUpData,
  validateEmail,
  encryptPassword,
} = require("../utils");

// authRouter.post("/signup", async (req, res) => {
//   // const dummyUserObj = { name: "Naman", email: "naman123@gmail.com", password: "hkdnfnewofnrwov*kd", bio: "Mellow!!" };
//   try {
//     validateSignUpData(req);
//     const password = await encryptPassword(req);
//     const { name, avatar, email, age, gender, bio } = req.body;
//     const user = new User({
//       name,
//       avatar,
//       email,
//       password,
//       age,
//       gender,
//       bio,
//     });
//     await user.save();
//     console.log("> User added successfully...");
//     res.status(201).send("User added successfully...");
//   } catch (err) {
//     console.log("> Error: " + err.message);
//     res.status(400).send("Something Went wrong: " + err.message);
//   }
// });

authRouter.post("/signup", async (req, res) => {
  try {
    console.log("1. Request received");

    validateSignUpData(req);
    console.log("2. Validation passed");

    const password = await encryptPassword(req);
    console.log("3. Password encrypted");

    const { name, avatar, email, age, gender, bio } = req.body;

    const user = new User({
      name,
      avatar,
      email,
      password,
      age,
      gender,
      bio,
    });

    console.log("4. User object created");

    await user.save();
    console.log("5. User saved");

    res.status(201).send("User added successfully...");
    console.log("6. Response sent");
  } catch (err) {
    console.log("> Error:", err);
    res.status(400).send("Something went wrong: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Email and Password are required...");
    }
    if (!validateEmail(email)) {
      console.log("> Error: Email");
      return res.status(401).send("Invalid Email or Password...");
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log("> Error: User");
      return res.status(401).send("Invalid Email or Password...");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("> Error: Password");
      return res.status(401).send("Invalid Email or Password...");
    }
    const token = user.getJWT(ENV.JWT_SECRET_KEY); // Create a JWT Token
    // Add token to cookie and send the response back to user
    res.cookie("token", token, {
      expires: new Date(Date.now() + 3 * 3600000),
    });
    res.status(200).send("Login successful!");
  } catch (err) {
    console.log("> Error Loging In...");
    res.status(500).send("Something went wrong...");
  }
});

authRouter.post("/logout", async (req, res) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .send();
});

// authRouter.post("/refresh", async (req, res) => {});

module.exports = authRouter;
