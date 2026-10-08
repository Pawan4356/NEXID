const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Mongoose middleware hook, Mongoose runs this function before it validates the document.
followSchema.pre("validate", function () {
  if (this.followerId.equals(this.followingId)) {
    throw new Error("A user cannot follow themselves");
  }
});

// This creates a compound index on: followerId + followingId
// Same follower -> same following pair can exist only once
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;
