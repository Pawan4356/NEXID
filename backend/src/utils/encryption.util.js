const bcrypt = require("bcrypt");

const encryptPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    throw new Error("Enter a valid Password!");
  }
};

module.exports = {
  encryptPassword,
};
