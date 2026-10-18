const authRouter = require("./auth.router");
const userRouter = require("./user.router");
const followRouter = require("./follow.router");
const noteRouter = require("./note.router");
const canvasRouter = require("./canvas.router");
const elementRouter = require("./element.router");
const commentRouter = require("./comment.router");
const likeRouter = require("./like.router");
const invitationRouter = require("./invitation.router");
const notificationRouter = require("./notification.router");

module.exports = {
  authRouter,
  userRouter,
  followRouter,
  noteRouter,
  canvasRouter,
  elementRouter,
  commentRouter,
  likeRouter,
  invitationRouter,
  notificationRouter,
};
