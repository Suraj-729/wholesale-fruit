import mongoose from "mongoose";

const fruitSchema = new mongoose.Schema({
  FruitID: { type: String, required: true, unique: true },
  FruitName: { type: String, required: true },
  PackageType: { type: String, required: true },
  AvailableQuantity: { type: Number, required: true },
  Price: { type: Number, required: true },
  imageUrl: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 },
  CreatedDate: { type: String, required: true },
});

export default mongoose.model("Fruit", fruitSchema);
