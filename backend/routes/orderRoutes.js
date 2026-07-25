import { Router } from "express";
import { createOrder, editOrder, getOrderById, listOrders } from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
router.route("/").get(asyncHandler(listOrders)).post(asyncHandler(createOrder));
router.get("/:id", asyncHandler(getOrderById));
router.put("/:id", asyncHandler(editOrder));

export default router;
