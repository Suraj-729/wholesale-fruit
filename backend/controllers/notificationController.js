import Notification from "../models/Notification.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";

export async function listNotifications(req, res) {
  const { role, retailerMobile } = req.query;

  if (!role) {
    throw badRequest("Role query parameter is required.");
  }

  let query = { recipientRole: role };
  if (role === "Retailer") {
    if (!retailerMobile) {
      throw badRequest("retailerMobile is required for Retailer role.");
    }
    query.recipientMobile = retailerMobile;
  }

  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

  res.json({
    notifications,
    unreadCount,
  });
}

export async function markRead(req, res) {
  const { id } = req.params;
  const notification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw notFoundError("Notification not found.");
  }

  res.json(notification);
}

export async function markAllRead(req, res) {
  const { role, retailerMobile } = req.body;

  if (!role) {
    throw badRequest("Role is required.");
  }

  let query = { recipientRole: role, isRead: false };
  if (role === "Retailer") {
    if (!retailerMobile) {
      throw badRequest("retailerMobile is required for Retailer role.");
    }
    query.recipientMobile = retailerMobile;
  }

  await Notification.updateMany(query, { isRead: true });

  res.json({ message: "All notifications marked as read." });
}
