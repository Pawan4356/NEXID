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
      enum: ["public", "protected", "friends", "private"],
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
    scene: { type: mongoose.Schema.Types.Mixed, default: () => ({ elements: [], appState: {}, files: {} }) },
    isFavorite: { type: Boolean, default: false },
    lastViewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

const Canvas = mongoose.model("Canvas", canvasSchema);
module.exports = Canvas;
