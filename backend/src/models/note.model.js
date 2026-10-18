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
      type: mongoose.Schema.Types.Mixed,
      maxLength: 1024 * 1024,
      default: [],
    },
    visibility: {
      type: String,
      lowercase: true,
      enum: ["public", "protected", "friends", "private"],
      default: "private",
      required: true,
    },
    icon: { type: String, default: "file-text" },
    isFavorite: { type: Boolean, default: false },
    settings: {
      fullWidth: { type: Boolean, default: false },
      smallText: { type: Boolean, default: false },
      font: { type: String, default: "default" },
      locked: { type: Boolean, default: false },
    },
    lastViewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
