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

const Like = mongoose.model("Like", likeSchema);
module.exports = Like;
