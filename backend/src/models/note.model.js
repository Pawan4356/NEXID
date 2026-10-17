// Handles Notes, Blogs, Todos...

const mongoose = require("mongoose");

const noteSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Note",
    },
    title: {
      type: String,
      maxLength: 1024,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      maxLength: 1024 * 1024,
      trim: true,
    },
    visibility: {
      type: String,
      lowercase: true,
      enum: ["public", "protected", "private"],
      default: "private",
      required: true,
    },
  },
  {
    timestamp: true,
  },
);

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
