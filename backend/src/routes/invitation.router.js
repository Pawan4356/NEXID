const express = require("express");
const mongoose = require("mongoose");
const Invitation = require("../models/invitation.model");
const Note = require("../models/note.model");
const Canvas = require("../models/canvas.model");
const User = require("../models/user.model");
const userAuth = require("../middleware/auth.middleware");
const { createNotification } = require("../utils/notification.util");

const invitationRouter = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);

invitationRouter.use(userAuth);

invitationRouter.post("/", async (req, res) => {
  const { recieverId, recipientId, resourceId, resourceType = "note", role = "viewer" } = req.body;
  let targetId = recieverId || recipientId;
  if (!targetId && req.body.email) {
    const byEmail = await User.findOne({ email: req.body.email }).select("_id");
    targetId = byEmail?._id;
  }
  if (
    ![targetId, resourceId].every(isId) ||
    targetId.toString() === req.user._id.toString()
  )
    return res
      .status(400)
      .json({ message: "Valid recipient and resource are required." });
  const Resource = resourceType === "diagram" ? Canvas : Note;
  const ownerField = resourceType === "diagram" ? "authorId" : "userId";
  const [recipient, resource] = await Promise.all([
    User.findById(targetId),
    Resource.findOne({ _id: resourceId, [ownerField]: req.user._id }),
  ]);
  if (!recipient)
    return res.status(404).json({ message: "Recipient not found." });
  if (!resource)
    return res
      .status(404)
      .json({ message: "Note not found or not owned by sender." });
  const existing = await Invitation.findOne({
    senderId: req.user._id,
    recieverId: targetId,
    resourceId,
    status: "pending",
  });
  if (existing)
    return res.status(409).json({ message: "Invitation already pending." });
  try {
    const invitation = await Invitation.create({
      senderId: req.user._id,
      recieverId: targetId,
      resourceId,
      resourceType,
      role,
    });
    await createNotification({
      userId: targetId,
      actorId: req.user._id,
      type: "invitation",
      resourceId: invitation._id,
      resourceModel: "Invitation",
    });
    return res.status(201).json({ invitation });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

invitationRouter.get("/", async (req, res) => {
  const filter =
    req.query.direction === "sent"
      ? { senderId: req.user._id }
      : { recieverId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.resourceId) filter.resourceId = req.query.resourceId;
  if (req.query.resourceType) filter.resourceType = req.query.resourceType;
  const invitations = await Invitation.find(filter)
    .populate("recieverId", "name email avatar")
    .sort({ createdAt: -1 });
  return res.json({ invitations });
});

invitationRouter.patch("/:invitationId/accept", async (req, res) => {
  if (!isId(req.params.invitationId))
    return res.status(400).json({ message: "Invalid invitation ID." });
  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: req.params.invitationId,
      recieverId: req.user._id,
      status: "pending",
    },
    { status: "accepted" },
    { new: true },
  );
  if (!invitation)
    return res
      .status(409)
      .json({ message: "Invitation is missing or cannot be accepted." });
  await createNotification({
    userId: invitation.senderId,
    actorId: req.user._id,
    type: "invitation",
    resourceId: invitation._id,
    resourceModel: "Invitation",
  });
  return res.json({ invitation });
});

invitationRouter.patch("/:invitationId/reject", async (req, res) => {
  if (!isId(req.params.invitationId))
    return res.status(400).json({ message: "Invalid invitation ID." });
  const invitation = await Invitation.findOneAndUpdate(
    {
      _id: req.params.invitationId,
      recieverId: req.user._id,
      status: "pending",
    },
    { status: "rejected" },
    { new: true },
  );
  if (!invitation)
    return res
      .status(409)
      .json({ message: "Invitation is missing or cannot be rejected." });
  return res.json({ invitation });
});

invitationRouter.patch("/:invitationId/revoke", async (req, res) => {
  if (!isId(req.params.invitationId))
    return res.status(400).json({ message: "Invalid invitation ID." });
  const invitation = await Invitation.findOneAndUpdate(
    { _id: req.params.invitationId, senderId: req.user._id, status: "pending" },
    { status: "revoked" },
    { new: true },
  );
  if (!invitation)
    return res
      .status(409)
      .json({ message: "Invitation is missing or cannot be revoked." });
  return res.json({ invitation });
});

invitationRouter.patch("/:invitationId/role", async (req, res) => {
  if (!isId(req.params.invitationId) || !["viewer", "editor"].includes(req.body.role))
    return res.status(400).json({ message: "Invalid invitation or role." });
  const invitation = await Invitation.findOneAndUpdate(
    { _id: req.params.invitationId, senderId: req.user._id, status: "pending" },
    { role: req.body.role },
    { new: true },
  );
  if (!invitation) return res.status(404).json({ message: "Invitation not found." });
  return res.json({ invitation });
});

module.exports = invitationRouter;
