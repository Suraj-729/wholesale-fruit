import mongoose from "mongoose";

const timelineItemSchema = new mongoose.Schema({
  status: { type: String, required: true },
  title: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  performedBy: { type: String, required: true },
  role: { type: String, required: true },
});

const orderItemSchema = new mongoose.Schema({
  FruitID: { type: String, required: true },
  FruitName: { type: String, required: true },
  PackageType: { type: String, required: true },
  Quantity: { type: Number, required: true },
  Price: { type: Number, required: true },
  Total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  OrderID: { type: String, required: true, unique: true },
  RetailerMobile: { type: String, required: true },
  RetailerName: { type: String, required: true },
  Items: [orderItemSchema],
  FruitID: { type: String },
  FruitName: { type: String, required: true },
  PackageType: { type: String },
  Quantity: { type: Number, required: true },
  Price: { type: Number },
  Total: { type: Number, required: true },
  Status: { 
    type: String, 
    required: true, 
    enum: ["Pending", "Accepted", "Rejected", "Delivered"],
    default: "Pending"
  },
  OrderDate: { type: String, required: true },
  Timeline: [timelineItemSchema]
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
