const express = require("express");
const mongoose = require("mongoose");
const Notification = require("../models/notification.model");
const userAuth = require("../middleware/auth.middleware");

const notificationRouter = express.Router();
notificationRouter.use(userAuth);

notificationRouter.get("/", async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.unread === "true") filter.read = false;
  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  return res.json({ notifications });
});

notificationRouter.patch("/read-all", async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user._id, read: false },
    { $set: { read: true } },
  );
  return res.json({ modifiedCount: result.modifiedCount });
});

notificationRouter.patch("/:notificationId/read", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.notificationId))
    return res.status(400).json({ message: "Invalid notification ID." });
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user._id },
    { read: true },
    { new: true },
  );
  if (!notification)
    return res.status(404).json({ message: "Notification not found." });
  return res.json({ notification });
});

notificationRouter.delete("/:notificationId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.notificationId))
    return res.status(400).json({ message: "Invalid notification ID." });
  const deleted = await Notification.findOneAndDelete({
    _id: req.params.notificationId,
    userId: req.user._id,
  });
  if (!deleted)
    return res.status(404).json({ message: "Notification not found." });
  return res.json({ message: "Notification deleted." });
});

module.exports = notificationRouter;
