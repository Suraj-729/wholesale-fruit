import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: { type: String, required: true, enum: ["Admin", "Retailer", "All"] },
    recipientMobile: { type: String, default: null },
    orderId: { type: String, default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["NEW_ORDER", "ORDER_ACCEPTED", "ORDER_REJECTED", "ORDER_DELIVERED", "MARKETING_OFFER"],
    },
    imageUrl: { type: String, default: null },
    actionText: { type: String, default: "Order Now" },
    deepLink: { type: String, default: "market" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
