import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: { type: String, required: true, enum: ["Admin", "Retailer"] },
    recipientMobile: { type: String, default: null },
    orderId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["NEW_ORDER", "ORDER_ACCEPTED", "ORDER_REJECTED", "ORDER_DELIVERED"],
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
