import express from "express";
import { 
  listNotifications, 
  markRead, 
  markAllRead, 
  createAdvertisementNotification,
  getSchedulerStatusController,
  toggleSchedulerActiveController,
  triggerAutoTestController
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", listNotifications);
router.post("/broadcast", createAdvertisementNotification);
router.get("/scheduler-status", getSchedulerStatusController);
router.post("/scheduler-toggle", toggleSchedulerActiveController);
router.post("/trigger-auto-test", triggerAutoTestController);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;
