import express from "express";
import { listNotifications, markRead, markAllRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", listNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;
