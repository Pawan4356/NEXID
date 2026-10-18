const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Note",
    },
    canvasId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Canvas",
    },
    content: {
      type: String,
      minLength: 1,
      maxLength: 1024 * 8,
      required: true,
      trim: true,
    },
    resolved: { type: Boolean, default: false },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
  },
);

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
