const express = require("express");
const mongoose = require("mongoose");
const Note = require("../models/note.model");
const userAuth = require("../middleware/auth.middleware");
const { validateParent } = require("../utils");

const noteRouter = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);
const ownerQuery = (noteId, userId) => ({ _id: noteId, userId });

noteRouter.use(userAuth);

noteRouter.post("/", async (req, res) => {
  try {
    const { parentId = null, title = "Untitled", content, visibility, icon, isFavorite, settings } = req.body;
    if (
      !title.trim() ||
      (parentId &&
        !(
          isId(parentId) && (await validateParent(null, parentId, req.user._id))
        ))
    ) {
      return res
        .status(400)
        .json({ message: "A valid title and parent are required." });
    }
    const note = await Note.create({
      userId: req.user._id,
      parentId,
      title,
      content,
      visibility,
      icon,
      isFavorite,
      settings,
    });
    return res.status(201).json({ note });
  } catch (err) {
    return res
      .status(err.name === "ValidationError" ? 400 : 500)
      .json({ message: err.message });
  }
});

noteRouter.get("/", async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.parentId !== undefined) {
      if (req.query.parentId !== "null" && !isId(req.query.parentId))
        return res.status(400).json({ message: "Invalid parent ID." });
      filter.parentId =
        req.query.parentId === "null" ? null : req.query.parentId;
    }
    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { content: { $regex: escaped, $options: "i" } },
      ];
    }
    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    return res.status(200).json({ notes });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

noteRouter.get("/:noteId/tree", async (req, res) => {
  if (!isId(req.params.noteId))
    return res.status(400).json({ message: "Invalid note ID." });
  const root = await Note.findOne(ownerQuery(req.params.noteId, req.user._id));
  if (!root) return res.status(404).json({ message: "Note not found." });
  const notes = await Note.find({ userId: req.user._id });
  const byParent = new Map();
  for (const note of notes) {
    const key = note.parentId ? note.parentId.toString() : "null";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(note);
  }
  const addChildren = (note) => ({
    ...note.toObject(),
    children: (byParent.get(note._id.toString()) || []).map(addChildren),
  });
  return res.json({ note: addChildren(root) });
});

noteRouter.get("/:noteId", async (req, res) => {
  if (!isId(req.params.noteId))
    return res.status(400).json({ message: "Invalid note ID." });
  const note = await Note.findById(req.params.noteId);
  if (!note) return res.status(404).json({ message: "Note not found." });
  if (note.visibility === "private" && !note.userId.equals(req.user._id))
    return res.status(403).json({ message: "Not authorized." });
  return res.json({ note });
});

noteRouter.patch("/:noteId", async (req, res) => {
  const { noteId } = req.params;
  if (!isId(noteId))
    return res.status(400).json({ message: "Invalid note ID." });
  const note = await Note.findOne(ownerQuery(noteId, req.user._id));
  if (!note) return res.status(404).json({ message: "Note not found." });
  const allowed = ["parentId", "title", "content", "visibility", "icon", "isFavorite", "settings", "lastViewedAt"];
  const updates = req.body || {};
  if (
    !Object.keys(updates).length ||
    Object.keys(updates).some((key) => !allowed.includes(key))
  )
    return res.status(400).json({ message: "Invalid note fields." });
  if (
    Object.hasOwn(updates, "parentId") &&
    updates.parentId !== null &&
    (!isId(updates.parentId) ||
      !(await validateParent(noteId, updates.parentId, req.user._id)))
  ) {
    return res
      .status(400)
      .json({ message: "Invalid parent or circular nesting detected." });
  }
  try {
    const updatedNote = await Note.findOneAndUpdate(
      ownerQuery(noteId, req.user._id),
      updates,
      { new: true, runValidators: true },
    );
    return res.json({ note: updatedNote });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

noteRouter.delete("/:noteId", userAuth, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user._id;
    const note = await Note.findOne({
      _id: noteId,
      userId,
    });
    if (!note) {
      return res.status(404).send("Note not found.");
    }
    const allNotes = await Note.find({ userId }).select("_id parentId").lean();
    const childrenMap = new Map();

    for (const item of allNotes) {
      if (item.parentId) {
        const parentKey = item.parentId.toString();
        if (!childrenMap.has(parentKey)) {
          childrenMap.set(parentKey, []);
        }
        childrenMap.get(parentKey).push(item._id.toString());
      }
    }

    // Collect the requested note and all descendants.
    const idsToDelete = [];
    const stack = [noteId];
    const visited = new Set();
    while (stack.length > 0) {
      const currentId = stack.pop();
      const currentKey = currentId.toString();
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      idsToDelete.push(currentId);
      const children = childrenMap.get(currentKey) || [];
      stack.push(...children);
    }
    // Delete the entire subtree.
    await Note.deleteMany({
      _id: { $in: idsToDelete },
      userId,
    });
    return res.status(200).json({
      message: "Note and its descendants deleted successfully.",
      deletedCount: idsToDelete.length,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        message: "Invalid note ID.",
      });
    }

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
});

module.exports = noteRouter;
