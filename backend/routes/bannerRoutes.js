import express from "express";
import { createBanner, deleteBanner, listBanners } from "../controllers/bannerController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/", asyncHandler(listBanners));
router.post("/", asyncHandler(createBanner));
router.delete("/:id", asyncHandler(deleteBanner));

export default router;
