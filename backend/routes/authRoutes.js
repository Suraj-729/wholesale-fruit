import { Router } from "express";
import { login, resetUserPassword, resetAdminPassword } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
router.post("/login", asyncHandler(login));
router.put("/reset-user-password", asyncHandler(resetUserPassword));
router.put("/reset-admin-password", asyncHandler(resetAdminPassword));
export default router;
