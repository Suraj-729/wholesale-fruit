import { Router } from "express";
import { createOrder, editOrder, listOrders } from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
router.route("/").get(asyncHandler(listOrders)).post(asyncHandler(createOrder));
router.put("/:id", asyncHandler(editOrder));
export default router;
