import mongoose from "mongoose";

const retailerSchema = new mongoose.Schema({
  MobileNumber: { type: String, required: true, unique: true },
  RetailerName: { type: String, required: true },
  ShopName: { type: String, required: true },
  Address: { type: String, required: true },
  CreatedDate: { type: String, required: true },
});

export default mongoose.model("Retailer", retailerSchema);
