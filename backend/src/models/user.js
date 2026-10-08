const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 2,
      maxLength: 60,
    },
    avatar: {
      type: String,
      default: "https://stock.adobe.com/search?k=default+avatar",
    },
    age: {
      type: Number,
      min: 5,
      max: 120,
    },
    gender: {
      type: String,
      lowercase: true,
      enum: ["male", "female", "other"],
      // validate(val) {
      //   if (!["male", "female", "other"].includes(val)) {
      //     throw new Error("Gender value is not valid");
      //   }
      // }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw new Error("Email is not valid: " + val);
        }
      },
    },
    password: {
      type: String,
      required: true,
      // validate(val) {
      //   if (!validator.isStrongPassword(val)) {
      //     throw new Error("Enter a strong Password...");
      //   }
      // }
    },
    bio: {
      type: String,
      trim: true,
      maxLength: 1024,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.getJWT = function (JWT_SECRET_KEY) {
  const user = this;
  const token = jwt.sign({ _id: user._id }, JWT_SECRET_KEY, {
    expiresIn: "3d",
  });
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
