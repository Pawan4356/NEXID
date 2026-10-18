const express = require("express");
const cookieParser = require("cookie-parser");

const noteRouter = express.Router();
noteRouter.use(express.json());
noteRouter.use(cookieParser());

const Note = require("../models/note.model");
const userAuth = require("../middleware/auth.middleware");

const validateParent = require("../utils");

noteRouter.post("/", userAuth, async (req, res) => {
  try {
    const { parentId, title, content } = req.body;
    const userId = req.user._id;
    if (parentId) {
      const parentNote = await Note.findOne({
        _id: parentId,
        userId,
      });
      if (!parentNote) {
        return res.status(400).json({
          message: "Invalid parent note.",
        });
      }
    }
    const note = new Note({
      userId,
      parentId: parentId || null,
      title,
      content,
    });
    await note.save();
    res.status(201).send("Note created...");
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
});

noteRouter.get("/", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notes = await Note.find({ userId: userId });
    if (!notes || Object.keys(notes).length === 0) {
      res.status(404).send("Notes not found!");
    }
    res.status(200).send({
      message: "Notes retrieved successfully!",
      notes,
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
});

noteRouter.get("/:noteId", userAuth, async (req, res) => {
  try {
    const { noteId } = req.params;
    if (!noteId) {
      res.status(400).send("Noted ID not provided!");
    }
    const note = await Note.findById(noteId);
    if (!note) {
      res.status(404).send("Note not found!");
    }
    const userId = req.user._id;
    const isOwner = note.userId.equals(userId);
    if (!isOwner && note.visibility === "private") {
      res.status(401).send("Not authorized!");
    }
    res.status(200).send({
      message: "Note retrieved successfully!",
      note,
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
});

noteRouter.patch("/:noteId", userAuth, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    if (!noteId) {
      res.status(400).send("Noted ID not provided!");
    }
    const note = await Note.findById(noteId);
    if (!note) {
      res.status(404).send("Note not found!");
    }
    const userId = req.user._id;
    const isOwner = note.userId.equals(userId);
    if (!isOwner) {
      res.status(401).send("Un Authorized...");
    }
    const newData = req.body;
    if (!newData || Object.keys(newData).length === 0) {
      res.status(400).send("Bad Request...");
    }
    if (Object.hasOwn(newData, "parentId")) {
      const isValid = await validateParent(noteId, newData.parentId, userId);
      if (!isValid) {
        return res.status(400).json({
          message: "Invalid parent or circular nesting detected.",
        });
      }
    }
    const ALLOWED_UPDATES = ["parentId", "title", "content", "visibility"];
    const isUpdateAllowed = Object.keys(newData).every((k) => {
      return ALLOWED_UPDATES.includes(k);
    });
    if (!isUpdateAllowed) {
      throw new Error("Update not allowed");
    }
    const updatedNote = await Note.findByIdAndUpdate(noteId, newData, {
      returnDocument: "after",
    });
    res.status(200).send({
      message: "Updated successfully!",
      updatedNote,
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
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
