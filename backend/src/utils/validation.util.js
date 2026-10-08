const validator = require("validator");
const bcrypt = require("bcrypt");

const validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    return false;
  }
  return true;
};

const validateSignUpData = (req) => {
  const { name, email, password } = req.body;
  if (!name) {
    throw new Error("Enter a valid name!");
  } else if (!email || !validateEmail(email)) {
    throw new Error("Enter a valid email!");
  } else if (!password || !validator.isStrongPassword(password)) {
    throw new Error("Enter a strong valid password!");
  }
};

const validateOldPassword = async (oldPassword, oldPasswordHash) => {
  return await bcrypt.compare(oldPassword, oldPasswordHash);
};

module.exports = {
  validateSignUpData,
  validateEmail,
  validateOldPassword,
};
