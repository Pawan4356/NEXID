const Notification = require("../models/notification.model");

const createNotification = async ({
  userId,
  actorId,
  type,
  resourceId,
  resourceModel,
}) => {
  if (!userId || (actorId && userId.toString() === actorId.toString())) {
    return null;
  }

  return Notification.create({
    userId,
    actorId: actorId || null,
    type,
    resourceId: resourceId || null,
    resourceModel: resourceModel || null,
  });
};

module.exports = { createNotification };
