import Retailer from "../models/Retailer.js";
import User from "../models/User.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";

function retailerInput(body) {
  const { mobileNumber, retailerName, shopName, address, password } = body;
  if (!/^\d{10}$/.test(String(mobileNumber || "").trim())) throw badRequest("Mobile number must contain exactly 10 digits.");
  if (![retailerName, shopName, address, password].every((value) => value?.trim())) throw badRequest("Retailer name, shop name, address and password are required.");
  return { MobileNumber: String(mobileNumber).trim(), RetailerName: retailerName.trim(), ShopName: shopName.trim(), Address: address.trim(), Password: password.trim() };
}

export async function listRetailers(req, res) {
  const query = req.query.search?.toLowerCase().trim();
  const rows = await Retailer.find();
  res.json(rows.filter((retailer) => !query || `${retailer.MobileNumber} ${retailer.RetailerName} ${retailer.ShopName}`.toLowerCase().includes(query)));
}

export async function createRetailer(req, res) {
  const { Password, ...retailer } = retailerInput(req.body);
  if (await Retailer.findOne({ MobileNumber: retailer.MobileNumber })) throw badRequest("This mobile number is already registered.");
  const data = { ...retailer, CreatedDate: new Date().toISOString() };
  await Retailer.create(data);
  await User.create({ Username: retailer.MobileNumber, Password: Password, Role: "Retailer" });
  res.status(201).json(data);
}

export async function editRetailer(req, res) {
  const retailer = await Retailer.findOne({ MobileNumber: req.params.mobile });
  if (!retailer) throw notFoundError("Retailer was not found.");
  const input = retailerInput({
    mobileNumber: req.params.mobile,
    retailerName: retailer.RetailerName,
    shopName: retailer.ShopName,
    address: retailer.Address,
    ...req.body,
  });
  const updated = await Retailer.findOneAndUpdate(
    { MobileNumber: req.params.mobile },
    input,
    { new: true }
  );
  res.json(updated);
}

export async function removeRetailer(req, res) {
  const retailer = await Retailer.findOne({ MobileNumber: req.params.mobile });
  if (!retailer) throw notFoundError("Retailer was not found.");
  await Retailer.findOneAndDelete({ MobileNumber: req.params.mobile });
  const userRow = await User.findOne({ Username: req.params.mobile });
  if (userRow) {
    await User.findOneAndDelete({ Username: req.params.mobile });
  }
  res.status(204).end();
}
