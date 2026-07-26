import Notification from "../models/Notification.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";
import { registerManualBroadcast, getSchedulerStatus, sendAutoPushNotification, AUTO_PUSH_TEMPLATES, setSchedulerActive } from "../services/pushScheduler.js";

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
    query = {
      $or: [
        { recipientRole: "Retailer", recipientMobile: retailerMobile },
        { recipientRole: "All" }
      ]
    };
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
    query = {
      $or: [
        { recipientRole: "Retailer", recipientMobile: retailerMobile, isRead: false },
        { recipientRole: "All", isRead: false }
      ]
    };
  }

  await Notification.updateMany(query, { isRead: true });

  res.json({ message: "All notifications marked as read." });
}

export async function createAdvertisementNotification(req, res) {
  const { title, message, imageUrl, actionText, deepLink, recipientRole } = req.body;

  if (!title?.trim() || !message?.trim()) {
    throw badRequest("Notification Title and Message/Description are required.");
  }

  const notification = await Notification.create({
    recipientRole: recipientRole || "All",
    recipientMobile: null,
    orderId: null,
    title: title.trim(),
    message: message.trim(),
    type: "MARKETING_OFFER",
    imageUrl: imageUrl || null,
    actionText: actionText || "Order Now",
    deepLink: deepLink || "market",
    isRead: false
  });

  registerManualBroadcast();

  const io = req.app.get("io");
  if (io) {
    io.emit("rich_push_advertisement", notification);
    io.emit("new_notification", notification);
  }

  res.json({ success: true, notification });
}

export async function getSchedulerStatusController(req, res) {
  const status = getSchedulerStatus();
  res.json(status);
}

export async function toggleSchedulerActiveController(req, res) {
  const { active } = req.body;
  setSchedulerActive(active);
  res.json({ success: true, active, status: getSchedulerStatus() });
}

export async function triggerAutoTestController(req, res) {
  const { timeSlot } = req.body; // 'morning', 'afternoon', 'night'
  const templates = AUTO_PUSH_TEMPLATES[timeSlot] || AUTO_PUSH_TEMPLATES.morning;
  const template = templates[Math.floor(Math.random() * templates.length)];

  const notification = await sendAutoPushNotification(req.app, template);
  res.json({ success: true, notification, slot: timeSlot });
}

