import { Router } from "express";
import { dashboard } from "../controllers/dashboardController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
router.get("/", asyncHandler(dashboard));
export default router;
