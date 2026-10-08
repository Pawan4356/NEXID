const express = require("express");
const cookieParser = require("cookie-parser");

const followRouter = express.Router();
followRouter.use(express.json());
followRouter.use(cookieParser());

const userAuth = require("../middleware/auth.middleware");
const User = require("../models/user.model");
const Follow = require("../models/follow.model");

followRouter.post("/:userId", userAuth, async (req, res) => {
  try {
    const following = await User.findById(req.params.userId);
    if (!following) {
      return res.status(404).send("User not found");
    }
    const followRequest = new Follow({
      followerId: req.user._id,
      followingId: following._id,
    });
    const result = await followRequest.save();
    res.status(201).send(result);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).send("Already following this user");
    }
    res.status(400).send("Error: " + err.message);
  }
});

followRouter.delete("/:userId", userAuth, async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    if (!followerId || !followingId) {
      return res.status(400).send("Bad Request...");
    }
    const filter = {
      followerId: followerId,
      followingId: followingId,
    };
    await Follow.findOneAndDelete(filter);
    res.status(200).send({
      message: "Unfollowed succesfully",
      follower: await User.findById(followerId),
      following: await User.findById(followingId),
    });
  } catch (err) {
    res.status(404).send("Nothing to Unfollow!");
  }
});

followRouter.get("/followers", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).send("Bad Request...");
    }
    const filter = {
      followingId: userId,
    };
    const follows = await Follow.find(filter);
    const followerIds = follows.map((follow) => follow.followerId);
    const followers = await User.find({
      _id: { $in: followerIds },
    }).select("-password");
    console.log(followers);
    res.send(followers);
  } catch (error) {
    res.status(404).send("Error: " + err.message);
  }
});

followRouter.get("/following", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).send("Bad Request...");
    }
    const filter = {
      followerId: userId,
    };
    const follows = await Follow.find(filter);
    const followingIds = follows.map((follow) => follow.followingId);
    const following = await User.find({
      _id: { $in: followingIds },
    }).select("-password");
    console.log(following);
    res.send(following);
  } catch (error) {
    res.status(404).send("Error: " + err.message);
  }
});

module.exports = followRouter;
