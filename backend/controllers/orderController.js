import Order from "../models/Order.js";
import Retailer from "../models/Retailer.js";
import Fruit from "../models/Fruit.js";
import Notification from "../models/Notification.js";
import { badRequest, notFoundError } from "../middleware/errorHandler.js";

const validStatuses = new Set(["Pending", "Accepted", "Rejected", "Delivered"]);

async function getNextOrderId() {
  // Retrieve orders and find highest numeric OrderID value safely
  const orders = await Order.find({}, { OrderID: 1 }).sort({ OrderID: -1 }).limit(20);
  let maxNum = 0;
  for (const o of orders) {
    if (o.OrderID) {
      const num = parseInt(o.OrderID.replace(/\D/g, ""), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `ORD${String(maxNum + 1).padStart(5, "0")}`;
}

export async function listOrders(req, res) {
  const { status, retailerMobile } = req.query;
  let query = {};
  if (status) query.Status = status;
  if (retailerMobile) query.RetailerMobile = retailerMobile;
  const orders = await Order.find(query).sort({ OrderDate: -1, _id: -1 });
  res.json(orders);
}

export async function getOrderById(req, res) {
  const order = await Order.findOne({ OrderID: req.params.id });
  if (!order) throw notFoundError("Order was not found.");
  res.json(order);
}

export async function createOrder(req, res) {
  const { retailerMobile, fruitId, quantity } = req.body;
  const orderQuantity = Number(quantity);
  if (!retailerMobile?.trim() || !fruitId?.trim() || !Number.isInteger(orderQuantity) || orderQuantity <= 0) {
    throw badRequest("Retailer, fruit and a positive whole-box quantity are required.");
  }
  
  const retailer = await Retailer.findOne({ MobileNumber: retailerMobile.trim() });
  const fruit = await Fruit.findOne({ FruitID: fruitId.trim() });
  
  if (!retailer) throw notFoundError("Retailer was not found.");
  if (!fruit) throw notFoundError("Fruit was not found.");
  
  // Atomic stock check & deduction in a single isolated MongoDB operation
  const updatedFruit = await Fruit.findOneAndUpdate(
    { FruitID: fruit.FruitID, AvailableQuantity: { $gte: orderQuantity } },
    { $inc: { AvailableQuantity: -orderQuantity } },
    { new: true }
  );

  if (!updatedFruit) {
    const currentFruit = await Fruit.findOne({ FruitID: fruit.FruitID });
    const currentStock = currentFruit ? Number(currentFruit.AvailableQuantity) : 0;
    throw badRequest(`Insufficient stock! Only ${currentStock} box(es) available.`);
  }

  const price = Number(fruit.Price);
  const now = new Date();
  
  let order;
  let attempts = 0;
  
  // Retry loop to handle concurrent OrderID collision gracefully
  while (!order && attempts < 10) {
    attempts++;
    const orderId = await getNextOrderId();
    
    const initialTimeline = [{
      status: "Pending",
      title: "Order Placed",
      timestamp: now,
      performedBy: retailer.RetailerName,
      role: "Retailer"
    }];

    const orderData = {
      OrderID: orderId,
      RetailerMobile: retailer.MobileNumber,
      RetailerName: retailer.RetailerName,
      FruitID: fruit.FruitID,
      FruitName: fruit.FruitName,
      PackageType: fruit.PackageType,
      Quantity: orderQuantity,
      Price: price,
      Total: orderQuantity * price,
      Status: "Pending",
      OrderDate: now.toISOString(),
      Timeline: initialTimeline
    };

    try {
      order = await Order.create(orderData);
    } catch (error) {
      if (error.code === 11000 && attempts < 10) {
        // Race condition: wait a small random delay and retry with next OrderID
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 50) + 20));
        continue;
      }
      // Rollback stock using $inc if unrecoverable error
      await Fruit.findOneAndUpdate({ FruitID: fruit.FruitID }, { $inc: { AvailableQuantity: orderQuantity } });
      throw error;
    }
  }

  // Create Notification for Admin
  const notification = await Notification.create({
    recipientRole: "Admin",
    recipientMobile: null,
    orderId: order.OrderID,
    title: "New Order Received",
    message: `${retailer.RetailerName} placed Order #${order.OrderID}.`,
    type: "NEW_ORDER",
    isRead: false
  });

  // WebSockets Broadcast
  const io = req.app.get("io");
  if (io) {
    io.to("admin").emit("new_notification", notification);
    io.emit("order_updated", order);
  }

  res.status(201).json(order);
}

export async function editOrder(req, res) {
  const order = await Order.findOne({ OrderID: req.params.id });
  if (!order) throw notFoundError("Order was not found.");
  
  let targetStatus = req.body.status;
  // Map legacy statuses if any
  if (targetStatus === "Approved") targetStatus = "Accepted";
  if (targetStatus === "Cancelled") targetStatus = "Rejected";

  if (!validStatuses.has(targetStatus)) {
    throw badRequest("Status must be Pending, Accepted, Rejected, or Delivered.");
  }
  
  if (order.Status === "Rejected" && targetStatus !== "Rejected") {
    throw badRequest("Rejected orders cannot be reactivated.");
  }

  if (order.Status === targetStatus) {
    return res.json(order);
  }

  const now = new Date();
  let timelineTitle = "";
  let notifTitle = "";
  let notifMsg = "";
  let notifType = "";

  if (targetStatus === "Accepted") {
    timelineTitle = "Accepted by Admin";
    notifTitle = "Your Order Has Been Accepted";
    notifMsg = `Order #${order.OrderID} has been accepted.`;
    notifType = "ORDER_ACCEPTED";
  } else if (targetStatus === "Rejected") {
    timelineTitle = "Order Rejected";
    notifTitle = "Order Rejected";
    notifMsg = `Your Order #${order.OrderID} has been rejected.`;
    notifType = "ORDER_REJECTED";
  } else if (targetStatus === "Delivered") {
    timelineTitle = "Order Delivered";
    notifTitle = "Order Delivered";
    notifMsg = `Your Order #${order.OrderID} has been delivered successfully.`;
    notifType = "ORDER_DELIVERED";
  }

  const timelineEntry = {
    status: targetStatus,
    title: timelineTitle,
    timestamp: now,
    performedBy: "Admin",
    role: "Admin"
  };

  const updatedOrder = await Order.findOneAndUpdate(
    { OrderID: req.params.id },
    { 
      $set: { Status: targetStatus },
      $push: { Timeline: timelineEntry }
    },
    { new: true }
  );

  // If order was rejected, restore stock
  if (targetStatus === "Rejected" && order.Status !== "Rejected") {
    const fruit = await Fruit.findOne({ FruitID: order.FruitID });
    if (fruit) {
      await Fruit.findOneAndUpdate(
        { FruitID: order.FruitID }, 
        { AvailableQuantity: Number(fruit.AvailableQuantity) + Number(order.Quantity) }
      );
    }
  }

  // Create Notification for Retailer
  const notification = await Notification.create({
    recipientRole: "Retailer",
    recipientMobile: order.RetailerMobile,
    orderId: order.OrderID,
    title: notifTitle,
    message: notifMsg,
    type: notifType,
    isRead: false
  });

  // Socket broadcast
  const io = req.app.get("io");
  if (io) {
    io.to(`retailer_${order.RetailerMobile}`).emit("new_notification", notification);
    io.emit("order_updated", updatedOrder);
  }

  res.json(updatedOrder);
}
