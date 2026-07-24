import Order from "../models/Order.js";
import Retailer from "../models/Retailer.js";
import Fruit from "../models/Fruit.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";

const statuses = new Set(["Pending", "Approved", "Delivered", "Cancelled"]);

async function getNextOrderId() {
  const lastOrder = await Order.findOne().sort({ OrderID: -1 });
  let nextNum = 1;
  if (lastOrder && lastOrder.OrderID) {
    const lastNum = parseInt(lastOrder.OrderID.replace("ORD", ""), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  return `ORD${String(nextNum).padStart(5, "0")}`;
}

export async function listOrders(req, res) {
  const { status, retailerMobile } = req.query;
  let query = {};
  if (status) query.Status = status;
  if (retailerMobile) query.RetailerMobile = retailerMobile;
  const orders = await Order.find(query).sort({ OrderDate: -1 });
  res.json(orders);
}

export async function createOrder(req, res) {
  const { retailerMobile, fruitId, quantity } = req.body;
  const orderQuantity = Number(quantity);
  if (!retailerMobile?.trim() || !fruitId?.trim() || !Number.isInteger(orderQuantity) || orderQuantity <= 0) throw badRequest("Retailer, fruit and a positive whole-box quantity are required.");
  
  const retailer = await Retailer.findOne({ MobileNumber: retailerMobile.trim() });
  const fruit = await Fruit.findOne({ FruitID: fruitId.trim() });
  
  if (!retailer) throw notFoundError("Retailer was not found.");
  if (!fruit) throw notFoundError("Fruit was not found.");
  
  const stock = Number(fruit.AvailableQuantity);
  if (orderQuantity > stock) throw badRequest(`Only ${stock} boxes are available.`);
  
  const price = Number(fruit.Price);
  const orderData = {
    OrderID: await getNextOrderId(),
    RetailerMobile: retailer.MobileNumber,
    RetailerName: retailer.RetailerName,
    FruitID: fruit.FruitID,
    FruitName: fruit.FruitName,
    PackageType: fruit.PackageType,
    Quantity: orderQuantity,
    Price: price,
    Total: orderQuantity * price,
    Status: "Pending",
    OrderDate: new Date().toISOString(),
  };
  
  await Fruit.findOneAndUpdate({ FruitID: fruit.FruitID }, { AvailableQuantity: stock - orderQuantity });
  
  try {
    const order = await Order.create(orderData);
    res.status(201).json(order);
  } catch (error) {
    await Fruit.findOneAndUpdate({ FruitID: fruit.FruitID }, { AvailableQuantity: stock });
    throw error;
  }
}

export async function editOrder(req, res) {
  const order = await Order.findOne({ OrderID: req.params.id });
  if (!order) throw notFoundError("Order was not found.");
  
  const status = req.body.status;
  if (!statuses.has(status)) throw badRequest("Status must be Pending, Approved, Delivered or Cancelled.");
  if (order.Status === "Cancelled" && status !== "Cancelled") throw badRequest("Cancelled orders cannot be reactivated.");
  
  const updated = await Order.findOneAndUpdate(
    { OrderID: req.params.id },
    { Status: status },
    { new: true }
  );
  res.json(updated);
}
