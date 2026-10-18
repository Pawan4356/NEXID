const express = require("express");
const mongoose = require("mongoose");
const Canvas = require("../models/canvas.model");
const Element = require("../models/element.model");
const Note = require("../models/note.model");
const userAuth = require("../middleware/auth.middleware");

const canvasRouter = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);
const fields = ["title", "visibility", "background", "viewport", "parentId", "scene", "isFavorite", "lastViewedAt"];

const canAccess = (canvas, userId) =>
  canvas && (canvas.authorId.equals(userId) || canvas.visibility !== "private");

canvasRouter.use(userAuth);

canvasRouter.post("/", async (req, res) => {
  try {
    const {
      title = "Untitled diagram",
      visibility,
      background,
      viewport,
      parentId = null,
      scene,
      isFavorite,
    } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required." });
    if (
      parentId &&
      (!isId(parentId) ||
        !(await Note.findOne({ _id: parentId, userId: req.user._id })))
    )
      return res.status(400).json({ message: "Invalid parent note." });
    const canvas = await Canvas.create({
      authorId: req.user._id,
      title,
      visibility,
      background,
      viewport,
      parentId,
      scene,
      isFavorite,
    });
    return res.status(201).json({ canvas });
  } catch (err) {
    return res
      .status(err.name === "ValidationError" ? 400 : 500)
      .json({ message: err.message });
  }
});

canvasRouter.get("/", async (req, res) => {
  const canvases = await Canvas.find({
    $or: [{ authorId: req.user._id }, { visibility: { $ne: "private" } }],
  }).sort({ updatedAt: -1 });
  return res.json({ canvases });
});

canvasRouter.get("/:canvasId", async (req, res) => {
  if (!isId(req.params.canvasId))
    return res.status(400).json({ message: "Invalid canvas ID." });
  const canvas = await Canvas.findById(req.params.canvasId);
  if (!canvas) return res.status(404).json({ message: "Canvas not found." });
  if (!canAccess(canvas, req.user._id))
    return res.status(403).json({ message: "Not authorized." });
  return res.json({ canvas });
});

canvasRouter.patch("/:canvasId", async (req, res) => {
  if (!isId(req.params.canvasId))
    return res.status(400).json({ message: "Invalid canvas ID." });
  const canvas = await Canvas.findOne({
    _id: req.params.canvasId,
    authorId: req.user._id,
  });
  if (!canvas) return res.status(404).json({ message: "Canvas not found." });
  const updates = req.body || {};
  if (
    !Object.keys(updates).length ||
    Object.keys(updates).some((key) => !fields.includes(key))
  )
    return res.status(400).json({ message: "Invalid canvas fields." });
  if (
    Object.hasOwn(updates, "parentId") &&
    updates.parentId &&
    (!isId(updates.parentId) ||
      !(await Note.findOne({ _id: updates.parentId, userId: req.user._id })))
  )
    return res.status(400).json({ message: "Invalid parent note." });
  try {
    const updated = await Canvas.findByIdAndUpdate(canvas._id, updates, {
      new: true,
      runValidators: true,
    });
    return res.json({ canvas: updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

canvasRouter.post("/:canvasId/duplicate", async (req, res) => {
  if (!isId(req.params.canvasId)) return res.status(400).json({ message: "Invalid canvas ID." });
  const source = await Canvas.findOne({ _id: req.params.canvasId, authorId: req.user._id });
  if (!source) return res.status(404).json({ message: "Canvas not found." });
  const copy = await Canvas.create({ ...source.toObject(), _id: undefined, title: `${source.title} (copy)`, isFavorite: false, lastViewedAt: null });
  return res.status(201).json({ canvas: copy });
});

canvasRouter.delete("/:canvasId", async (req, res) => {
  if (!isId(req.params.canvasId))
    return res.status(400).json({ message: "Invalid canvas ID." });
  const deleted = await Canvas.findOneAndDelete({
    _id: req.params.canvasId,
    authorId: req.user._id,
  });
  if (!deleted) return res.status(404).json({ message: "Canvas not found." });
  await Element.deleteMany({ canvasId: deleted._id });
  return res.json({ message: "Canvas deleted." });
});

module.exports = canvasRouter;
