const mongoose = require("mongoose");

const elementSchema = mongoose.Schema(
  {
    canvasId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Canvas",
      index: true,
    },
    xPosition: {
      type: Number,
      required: true,
    },
    yPosition: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
      min: 0,
    },
    width: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: [
        "rectangle",
        "ellipse",
        "line",
        "arrow",
        "text",
        "image",
        "freehand",
      ],
      required: true,
    },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  },
);

const Element = mongoose.model("Element", elementSchema);
module.exports = Element;
