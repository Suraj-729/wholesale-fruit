import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  OrderID: { type: String, required: true, unique: true },
  RetailerMobile: { type: String, required: true },
  RetailerName: { type: String, required: true },
  FruitID: { type: String, required: true },
  FruitName: { type: String, required: true },
  PackageType: { type: String, required: true },
  Quantity: { type: Number, required: true },
  Price: { type: Number, required: true },
  Total: { type: Number, required: true },
  Status: { type: String, required: true },
  OrderDate: { type: String, required: true },
});

export default mongoose.model("Order", orderSchema);
