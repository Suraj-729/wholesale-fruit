import { Router } from "express";
import { createRetailer, editRetailer, listRetailers, removeRetailer } from "../controllers/retailerController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
router.route("/").get(asyncHandler(listRetailers)).post(asyncHandler(createRetailer));
router.route("/:mobile").put(asyncHandler(editRetailer)).delete(asyncHandler(removeRetailer));
export default router;
