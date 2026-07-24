import User from "../models/User.js";
import Retailer from "../models/Retailer.js";
import { badRequest } from "../middleware/errorHandler.js";

export async function login(req, res) {
  const { username, password, mobileNumber } = req.body;
  
  const targetUsername = mobileNumber ? String(mobileNumber).trim() : username?.trim();
  if (!targetUsername || !password) throw badRequest("Provide your mobile number/username and password.");
  
  const user = await User.findOne({ Username: targetUsername });
  if (!user || user.Password !== password) {
    throw badRequest("Invalid username/mobile or password.");
  }
  
  if (user.Role.toLowerCase() === "admin") {
    return res.json({ user: { role: "Admin", username: user.Username } });
  } else {
    const retailer = await Retailer.findOne({ MobileNumber: user.Username });
    if (!retailer) throw badRequest("Retailer profile not found.");
    return res.json({ user: { role: "Retailer", mobileNumber: retailer.MobileNumber, retailerName: retailer.RetailerName, shopName: retailer.ShopName } });
  }
}

export async function resetUserPassword(req, res) {
  const { adminUsername, adminPassword, targetMobileNumber, newPassword } = req.body;
  
  if (!adminUsername || !adminPassword || !targetMobileNumber || !newPassword) {
    throw badRequest("Missing required fields.");
  }
  
  const adminUser = await User.findOne({ Username: adminUsername.trim() });
  if (!adminUser || adminUser.Password !== adminPassword || adminUser.Role.toLowerCase() !== "admin") {
    throw badRequest("Unauthorized: Invalid admin credentials.");
  }
  
  const targetUser = await User.findOne({ Username: targetMobileNumber.trim(), Role: "Retailer" });
  if (!targetUser) throw badRequest("Retailer not found.");
  
  targetUser.Password = newPassword;
  await targetUser.save();
  
  res.json({ message: "Password updated successfully." });
}

export async function resetAdminPassword(req, res) {
  const { adminUsername, resetKey, newPassword } = req.body;
  
  if (!adminUsername || !resetKey || !newPassword) {
    throw badRequest("Missing required fields.");
  }
  
  if (resetKey !== process.env.ADMIN_RESET_KEY) {
    throw badRequest("Invalid reset key.");
  }
  
  const adminUser = await User.findOne({ Username: adminUsername.trim(), Role: { $regex: /^admin$/i } });
  if (!adminUser) throw badRequest("Admin user not found.");
  
  adminUser.Password = newPassword;
  await adminUser.save();
  
  res.json({ message: "Admin password updated successfully." });
}

