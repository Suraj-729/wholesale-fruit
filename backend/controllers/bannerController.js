import Banner from "../models/Banner.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";

export async function listBanners(req, res) {
  const banners = await Banner.find().sort({ createdAt: -1 });
  res.json(banners);
}

export async function createBanner(req, res) {
  const { title, subtitle, tag, bgGradient, imageUrl, buttonText } = req.body;

  if (!title?.trim() && !imageUrl) {
    throw badRequest("Please enter a Banner Title OR upload a Banner Image.");
  }

  // Check Base64 image size limit (~2MB file size = ~2.8MB base64 string length)
  if (imageUrl && imageUrl.length > 2800000) {
    throw badRequest("Banner image size exceeds the 2MB limit. Please upload a smaller image.");
  }

  const banner = await Banner.create({
    title: title?.trim() || "",
    subtitle: subtitle?.trim() || "",
    tag: tag?.trim() || (imageUrl ? "IMAGE BANNER" : "SPECIAL OFFER"),
    bgGradient: bgGradient || "emerald",
    imageUrl: imageUrl || "",
    buttonText: buttonText?.trim() || "Shop Wholesale Crates",
  });

  res.status(201).json(banner);
}

export async function deleteBanner(req, res) {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) {
    throw notFoundError("Banner was not found.");
  }
  res.json({ message: "Banner deleted successfully.", bannerId: req.params.id });
}
