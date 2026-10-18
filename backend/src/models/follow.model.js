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
  if (
    this.followerId &&
    this.followingId &&
    this.followerId.equals(this.followingId)
  ) {
    this.invalidate("A user cannot follow themselves");
  }
});

// This creates a compound index on: followerId + followingId
// Prevent duplicate follow pairs
// And support queries by followerId
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
// Support queries by followingId
followSchema.index({ followingId: 1 });

const Follow = mongoose.model("Follow", followSchema);
module.exports = Follow;
