const mongoose = require("mongoose");

const likeSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Note",
    },
  },
  {
    timestamps: true,
  },
);

likeSchema.index({ userId: 1, noteId: 1 }, { unique: true });
const Like = mongoose.model("Like", likeSchema);
module.exports = Like;
