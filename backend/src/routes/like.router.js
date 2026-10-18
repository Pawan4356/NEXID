const express = require("express");
const mongoose = require("mongoose");
const Like = require("../models/like.model");
const Note = require("../models/note.model");
const userAuth = require("../middleware/auth.middleware");
const { createNotification } = require("../utils/notification.util");

const likeRouter = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);

likeRouter.use(userAuth);

const getNote = async (noteId, userId) => {
  if (!isId(noteId)) return null;
  const note = await Note.findById(noteId);
  return note && (note.userId.equals(userId) || note.visibility !== "private")
    ? note
    : null;
};

likeRouter.post("/:noteId", async (req, res) => {
  const note = await getNote(req.params.noteId, req.user._id);
  if (!note) return res.status(404).json({ message: "Note not found." });
  try {
    const like = await Like.create({ userId: req.user._id, noteId: note._id });
    await createNotification({
      userId: note.userId,
      actorId: req.user._id,
      type: "like",
      resourceId: note._id,
      resourceModel: "Note",
    });
    return res.status(201).json({ like });
  } catch (err) {
    return res.status(err.code === 11000 ? 409 : 400).json({
      message: err.code === 11000 ? "Note already liked." : err.message,
    });
  }
});

likeRouter.delete("/:noteId", userAuth, async (req, res) => {
  if (!isId(req.params.noteId))
    return res.status(400).json({ message: "Invalid note ID." });
  const deleted = await Like.findOneAndDelete({
    userId: req.user._id,
    noteId: req.params.noteId,
  });
  if (!deleted) return res.status(404).json({ message: "Like not found." });
  return res.json({ message: "Note unliked." });
});

likeRouter.get("/:noteId/count", async (req, res) => {
  const note = await getNote(req.params.noteId, req.user._id);
  if (!note) return res.status(404).json({ message: "Note not found." });
  return res.json({ count: await Like.countDocuments({ noteId: note._id }) });
});

likeRouter.get("/:noteId/me", async (req, res) => {
  const note = await getNote(req.params.noteId, req.user._id);
  if (!note) return res.status(404).json({ message: "Note not found." });
  return res.json({
    liked: Boolean(
      await Like.exists({ noteId: note._id, userId: req.user._id }),
    ),
  });
});

module.exports = likeRouter;
