const express = require("express");
const mongoose = require("mongoose");
const Element = require("../models/element.model");
const Canvas = require("../models/canvas.model");
const userAuth = require("../middleware/auth.middleware");

const elementRouter = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);
const elementFields = [
  "xPosition",
  "yPosition",
  "height",
  "width",
  "type",
  "rotation",
  "zIndex",
  "data",
  "style",
];

const getCanvas = async (canvasId, userId, ownerOnly = false) => {
  if (!isId(canvasId)) return null;
  const canvas = await Canvas.findById(canvasId);
  if (
    !canvas ||
    (ownerOnly && !canvas.authorId.equals(userId)) ||
    (!ownerOnly &&
      !canvas.authorId.equals(userId) &&
      canvas.visibility === "private")
  )
    return null;
  return canvas;
};

elementRouter.use(userAuth);

elementRouter.get(["/canvas/:canvasId", "/:canvasId"], async (req, res) => {
  const canvas = await getCanvas(req.params.canvasId, req.user._id, true);
  if (!canvas) return res.status(404).json({ message: "Canvas not found." });
  const elements = await Element.find({ canvasId: canvas._id }).sort({
    zIndex: 1,
    createdAt: 1,
  });
  return res.json({ elements });
});

elementRouter.post(["/canvas/:canvasId", "/:canvasId"], async (req, res) => {
  const canvas = await getCanvas(req.params.canvasId, req.user._id);
  if (!canvas) return res.status(404).json({ message: "Canvas not found." });
  try {
    const element = await Element.create({ ...req.body, canvasId: canvas._id });
    return res.status(201).json({ element });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

elementRouter.patch("/:elementId", async (req, res) => {
  if (!isId(req.params.elementId))
    return res.status(400).json({ message: "Invalid element ID." });
  const element = await Element.findById(req.params.elementId);
  if (!element) return res.status(404).json({ message: "Element not found." });
  if (!(await getCanvas(element.canvasId, req.user._id, true)))
    return res.status(403).json({ message: "Not authorized." });
  const updates = req.body || {};
  if (
    !Object.keys(updates).length ||
    Object.keys(updates).some((key) => !elementFields.includes(key))
  )
    return res.status(400).json({ message: "Invalid element fields." });
  try {
    const updated = await Element.findByIdAndUpdate(element._id, updates, {
      new: true,
      runValidators: true,
    });
    return res.json({ element: updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

elementRouter.delete("/:elementId", async (req, res) => {
  if (!isId(req.params.elementId))
    return res.status(400).json({ message: "Invalid element ID." });
  const element = await Element.findById(req.params.elementId);
  if (!element) return res.status(404).json({ message: "Element not found." });
  if (!(await getCanvas(element.canvasId, req.user._id, true)))
    return res.status(403).json({ message: "Not authorized." });
  await element.deleteOne();
  return res.json({ message: "Element deleted." });
});

module.exports = elementRouter;
