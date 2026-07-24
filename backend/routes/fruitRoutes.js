import { Router } from "express";
import { createFruit, editFruit, listFruits, removeFruit } from "../controllers/fruitController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
router.route("/").get(asyncHandler(listFruits)).post(asyncHandler(createFruit));
router.route("/:id").put(asyncHandler(editFruit)).delete(asyncHandler(removeFruit));
export default router;
