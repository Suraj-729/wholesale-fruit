import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    tag: { type: String, default: "SPECIAL OFFER" },
    bgGradient: { type: String, default: "emerald" },
    imageUrl: { type: String, default: "" },
    buttonText: { type: String, default: "Shop Wholesale Crates" },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
