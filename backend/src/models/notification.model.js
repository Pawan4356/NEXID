const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["follow", "like", "comment", "reply", "share", "invitation"],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "resourceModel",
      default: null,
    },
    resourceModel: {
      type: String,
      enum: ["Note", "Comment", "Invitation", "Canvas"],
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Handles newest notifications efficiently...
notificationSchema.index({ userId: 1, createdAt: -1 });
const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
