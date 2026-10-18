const mongoose = require("mongoose");

const canvasSchema = mongoose.Schema(
  {
    authorId: {
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
      maxlength: 1024,
      required: true,
      trim: true,
    },
    visibility: {
      type: String,
      lowercase: true,
      enum: ["public", "protected", "private"],
      default: "private",
      required: true,
    },
    background: {
      type: String,
      default: "#ffffff",
    },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  },
);

const Canvas = mongoose.model("Canvas", canvasSchema);
module.exports = Canvas;
