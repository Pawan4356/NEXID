const validator = require("validator");
const bcrypt = require("bcrypt");
const Note = require("../models/note.model");

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

async function validateParent(noteId, parentId, userId) {
  if (!parentId) return true;
  const visited = new Set();
  let currentId = parentId;
  while (currentId) {
    const currentKey = currentId.toString();
    // The proposed parent is the note itself,
    // or one of its descendants.
    if (noteId && currentKey === noteId.toString()) {
      return false;
    }
    // Avoid infinite loops if existing data is corrupted.
    if (visited.has(currentKey)) {
      return false;
    }
    visited.add(currentKey);
    const currentNote = await Note.findOne({
      _id: currentId,
      userId,
    }).select("parentId");
    // Parent doesn't exist or isn't owned by this user.
    if (!currentNote) return false;
    currentId = currentNote.parentId;
  }
  return true;
}

module.exports = {
  validateSignUpData,
  validateEmail,
  validateOldPassword,
  validateParent,
};
