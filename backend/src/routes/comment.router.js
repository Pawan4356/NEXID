const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/comment.model");
const Note = require("../models/note.model");
const Canvas = require("../models/canvas.model");
const userAuth = require("../middleware/auth.middleware");
const { createNotification } = require("../utils/notification.util");

const commentRouter = express.Router();
const isId = (value) => mongoose.isValidObjectId(value);
const canRead = (resource, userId) =>
  resource && ((resource.userId || resource.authorId).equals(userId) || resource.visibility !== "private");

commentRouter.use(userAuth);

commentRouter.get(["/note/:noteId", "/diagram/:noteId", "/:noteId"], async (req, res) => {
  if (!isId(req.params.noteId))
    return res.status(400).json({ message: "Invalid note ID." });
  const isDiagram = req.path.startsWith("/diagram/");
  const resource = await (isDiagram ? Canvas : Note).findById(req.params.noteId);
  if (!canRead(resource, req.user._id))
    return res.status(404).json({ message: "Note not found." });
  const comments = await Comment.find(isDiagram ? { canvasId: resource._id } : { noteId: resource._id }).populate("authorId", "name email avatar").sort({
    createdAt: 1,
  });
  return res.json({ comments });
});

commentRouter.post(["/note/:noteId", "/diagram/:noteId", "/:noteId"], async (req, res) => {
  if (!isId(req.params.noteId))
    return res.status(400).json({ message: "Invalid note ID." });
  const isDiagram = req.path.startsWith("/diagram/");
  const resource = await (isDiagram ? Canvas : Note).findById(req.params.noteId);
  if (!canRead(resource, req.user._id))
    return res.status(404).json({ message: "Note not found." });
  const { content, parentId = null } = req.body;
  if (!content || !content.trim())
    return res.status(400).json({ message: "Content is required." });
  if (
    parentId &&
    (!isId(parentId) ||
      !(await Comment.findOne({ _id: parentId, noteId: note._id })))
  )
    return res.status(400).json({ message: "Invalid parent comment." });
  try {
    const comment = await Comment.create({
      authorId: req.user._id,
      ...(isDiagram ? { canvasId: resource._id } : { noteId: resource._id }),
      content,
      parentId,
    });
    await createNotification({
      userId: resource.userId || resource.authorId,
      actorId: req.user._id,
      type: parentId ? "reply" : "comment",
      resourceId: comment._id,
      resourceModel: "Comment",
    });
    return res.status(201).json({ comment });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

commentRouter.patch("/:commentId", async (req, res) => {
  if (!isId(req.params.commentId))
    return res.status(400).json({ message: "Invalid comment ID." });
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found." });
  if (!comment.authorId.equals(req.user._id))
    return res.status(403).json({ message: "Not authorized." });
  if (req.body.resolved !== undefined) {
    const updated = await Comment.findByIdAndUpdate(
      comment._id,
      { resolved: Boolean(req.body.resolved) },
      { new: true },
    );
    return res.json({ comment: updated });
  }
  if (!req.body.content || !req.body.content.trim())
    return res.status(400).json({ message: "Content is required." });
  try {
    const updated = await Comment.findByIdAndUpdate(
      comment._id,
      { content: req.body.content },
      { new: true, runValidators: true },
    );
    return res.json({ comment: updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

commentRouter.delete("/:commentId", async (req, res) => {
  if (!isId(req.params.commentId))
    return res.status(400).json({ message: "Invalid comment ID." });
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: "Comment not found." });
  const note = await Note.findById(comment.noteId);
  if (
    !comment.authorId.equals(req.user._id) &&
    (!note || !note.userId.equals(req.user._id))
  )
    return res.status(403).json({ message: "Not authorized." });
  const all = await Comment.find({ noteId: comment.noteId })
    .select("_id parentId")
    .lean();
  const children = new Map();
  all.forEach((item) => {
    if (item.parentId)
      children.set(item.parentId.toString(), [
        ...(children.get(item.parentId.toString()) || []),
        item._id,
      ]);
  });
  const ids = [];
  const stack = [comment._id];
  while (stack.length) {
    const id = stack.pop();
    ids.push(id);
    stack.push(...(children.get(id.toString()) || []));
  }
  await Comment.deleteMany({ _id: { $in: ids } });
  return res.json({ deletedCount: ids.length });
});

module.exports = commentRouter;
