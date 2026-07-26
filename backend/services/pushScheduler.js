import Notification from "../models/Notification.js";

let lastManualBroadcastTime = null;
let isSchedulerActive = true;

export function registerManualBroadcast() {
  lastManualBroadcastTime = new Date();
  console.log(`[PushScheduler] Manual broadcast registered at ${lastManualBroadcastTime.toISOString()}. Manual priority active for 2 hours.`);
}

export function getLastManualBroadcastTime() {
  return lastManualBroadcastTime;
}

export function setSchedulerActive(active) {
  isSchedulerActive = Boolean(active);
}

export function getSchedulerStatus() {
  const isManualPriorityActive = lastManualBroadcastTime && (Date.now() - new Date(lastManualBroadcastTime).getTime() < 2 * 60 * 60 * 1000);
  return {
    isSchedulerActive,
    lastManualBroadcastTime,
    isManualPriorityActive,
    scheduleDetails: "6-10 AM Hourly Morning, 12-4 PM Afternoon Deals, 8-10 PM Good Night"
  };
}

export const AUTO_PUSH_TEMPLATES = {
  morning: [
    {
      title: "🌅 Good Morning! Fresh Stock Arrived",
      message: "Good Morning! Fresh fruits have arrived today. Apples, Bananas, Mangoes at today's wholesale prices.",
      actionText: "Shop Now",
      imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop"
    },
    {
      title: "🥭 Alphonso Mangoes Morning Special",
      message: "Fresh Alphonso Mango crates at ₹180/kg. Order early before stock runs out today!",
      actionText: "Order Now",
      imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop"
    },
    {
      title: "🍎 Kashmiri Gala Apple Crates Ready",
      message: "Fresh Kashmiri Gala Apple 20KG boxes available today at special wholesale rate ₹2,180.",
      actionText: "View Crates",
      imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop"
    }
  ],
  afternoon: [
    {
      title: "☀️ Good Afternoon Wholesale Deals",
      message: "Special afternoon discounts on wholesale fruit crates! Order now for same-day delivery.",
      actionText: "Shop Deals",
      imageUrl: "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&auto=format&fit=crop"
    }
  ],
  night: [
    {
      title: "🌙 Good Night Stock Update",
      message: "Thank you for choosing us today. Tomorrow's fresh stock will be available from 5:00 AM.",
      actionText: "View Stock",
      imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop"
    }
  ]
};

export async function sendAutoPushNotification(app, template) {
  try {
    const notification = await Notification.create({
      recipientRole: "All",
      recipientMobile: null,
      orderId: null,
      title: template.title,
      message: template.message,
      type: "MARKETING_OFFER",
      imageUrl: template.imageUrl || null,
      actionText: template.actionText || "Order Now",
      deepLink: "market",
      isRead: false
    });

    const io = app.get("io");
    if (io) {
      io.emit("rich_push_advertisement", notification);
      io.emit("new_notification", notification);
      console.log(`[PushScheduler] Auto Push Broadcast sent: "${template.title}"`);
    }
    return notification;
  } catch (error) {
    console.error("[PushScheduler] Error sending auto push:", error);
    return null;
  }
}

export async function checkAndSendScheduledPush(app) {
  if (!isSchedulerActive) return;

  // Check manual priority override (2-hour window)
  if (lastManualBroadcastTime) {
    const elapsedMs = Date.now() - new Date(lastManualBroadcastTime).getTime();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (elapsedMs < twoHoursMs) {
      console.log(`[PushScheduler] Skipping scheduled auto push: Manual notification priority active (${Math.round((twoHoursMs - elapsedMs) / 60000)} mins remaining).`);
      return;
    }
  }

  const now = new Date();
  const currentHour = now.getHours(); // 0 to 23

  let slot = null;
  let templates = [];

  // Morning Window: 6 AM to 10 AM (Hourly)
  if (currentHour >= 6 && currentHour <= 10) {
    slot = "morning";
    templates = AUTO_PUSH_TEMPLATES.morning;
  } 
  // Afternoon Window: 12 PM to 4 PM (12, 14, 16)
  else if (currentHour >= 12 && currentHour <= 16 && currentHour % 2 === 0) {
    slot = "afternoon";
    templates = AUTO_PUSH_TEMPLATES.afternoon;
  } 
  // Night Window: 8 PM to 10 PM (20, 22)
  else if (currentHour >= 20 && currentHour <= 22 && currentHour % 2 === 0) {
    slot = "night";
    templates = AUTO_PUSH_TEMPLATES.night;
  }

  if (!slot || templates.length === 0) return;

  // Prevent sending duplicate auto push within the same hour
  const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0);
  const endOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 59, 59);

  const existingInHour = await Notification.findOne({
    type: "MARKETING_OFFER",
    createdAt: { $gte: startOfHour, $lte: endOfHour }
  });

  if (existingInHour) {
    return; // Already sent a push notification during this hour
  }

  // Pick template based on current hour
  const templateIdx = currentHour % templates.length;
  const chosenTemplate = templates[templateIdx];

  await sendAutoPushNotification(app, chosenTemplate);
}

export function initPushScheduler(app) {
  console.log("[PushScheduler] Automated 24-Hour Rich Push Notification Scheduler initialized.");
  
  // Run check every 1 minute
  const intervalId = setInterval(() => {
    checkAndSendScheduledPush(app);
  }, 60 * 1000);

  // Initial check after server start (delayed 10s)
  setTimeout(() => {
    checkAndSendScheduledPush(app);
  }, 10000);

  return intervalId;
}
