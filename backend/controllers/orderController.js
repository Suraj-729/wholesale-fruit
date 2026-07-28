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
  const { retailerMobile, fruitId, quantity, items } = req.body;
  if (!retailerMobile?.trim()) throw badRequest("Retailer mobile number is required.");

  const retailer = await Retailer.findOne({ MobileNumber: retailerMobile.trim() });
  if (!retailer) throw notFoundError("Retailer was not found.");

  let rawItems = [];
  if (Array.isArray(items) && items.length > 0) {
    rawItems = items;
  } else if (fruitId?.trim() && Number(quantity) > 0) {
    rawItems = [{ fruitId: fruitId.trim(), quantity: Number(quantity) }];
  } else {
    throw badRequest("Order items are required.");
  }

  const processedItems = [];
  const deductedStockList = [];
  let totalOrderQuantity = 0;
  let totalOrderPrice = 0;

  try {
    for (const rawItem of rawItems) {
      const fId = String(rawItem.fruitId || "").trim();
      const qty = Number(rawItem.quantity);

      if (!fId || !Number.isInteger(qty) || qty <= 0) {
        throw badRequest("Each item must specify a valid fruit and a positive box quantity.");
      }

      const fruit = await Fruit.findOne({ FruitID: fId });
      if (!fruit) throw notFoundError(`Fruit "${fId}" was not found.`);

      const updatedFruit = await Fruit.findOneAndUpdate(
        { FruitID: fruit.FruitID, AvailableQuantity: { $gte: qty } },
        { $inc: { AvailableQuantity: -qty } },
        { new: true }
      );

      if (!updatedFruit) {
        const currentFruit = await Fruit.findOne({ FruitID: fruit.FruitID });
        const currentStock = currentFruit ? Number(currentFruit.AvailableQuantity) : 0;
        throw badRequest(`Insufficient stock for ${fruit.FruitName}! Only ${currentStock} box(es) available.`);
      }

      deductedStockList.push({ fruitId: fruit.FruitID, quantity: qty });

      const itemPrice = Number(fruit.Price);
      const itemSubtotal = qty * itemPrice;

      processedItems.push({
        FruitID: fruit.FruitID,
        FruitName: fruit.FruitName,
        PackageType: fruit.PackageType,
        Quantity: qty,
        Price: itemPrice,
        Total: itemSubtotal
      });

      totalOrderQuantity += qty;
      totalOrderPrice += itemSubtotal;
    }
  } catch (err) {
    for (const d of deductedStockList) {
      await Fruit.findOneAndUpdate({ FruitID: d.fruitId }, { $inc: { AvailableQuantity: d.quantity } });
    }
    throw err;
  }

  const fruitNameSummary = processedItems.map(i => `${i.FruitName} x ${i.Quantity}`).join(", ");
  const now = new Date();
  
  let order;
  let attempts = 0;
  
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

    const firstItem = processedItems[0] || {};
    const orderData = {
      OrderID: orderId,
      RetailerMobile: retailer.MobileNumber,
      RetailerName: retailer.RetailerName,
      Items: processedItems,
      FruitID: firstItem.FruitID,
      FruitName: fruitNameSummary,
      PackageType: processedItems.length === 1 ? firstItem.PackageType : `${processedItems.length} products`,
      Quantity: totalOrderQuantity,
      Price: processedItems.length === 1 ? firstItem.Price : undefined,
      Total: totalOrderPrice,
      Status: "Pending",
      OrderDate: now.toISOString(),
      Timeline: initialTimeline
    };

    try {
      order = await Order.create(orderData);
    } catch (error) {
      if (error.code === 11000 && attempts < 10) {
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 50) + 20));
        continue;
      }
      for (const d of deductedStockList) {
        await Fruit.findOneAndUpdate({ FruitID: d.fruitId }, { $inc: { AvailableQuantity: d.quantity } });
      }
      throw error;
    }
  }

  const notification = await Notification.create({
    recipientRole: "Admin",
    recipientMobile: null,
    orderId: order.OrderID,
    title: "New Order Received",
    message: `${retailer.RetailerName} placed Order #${order.OrderID} (${totalOrderQuantity} boxes).`,
    type: "NEW_ORDER",
    isRead: false
  });

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

  let notifImg = null;
  let actionTxt = "Track Order";

  if (targetStatus === "Accepted") {
    timelineTitle = "Accepted by Admin";
    notifTitle = `🚚 Order Accepted #${order.OrderID}`;
    notifMsg = `Your order #${order.OrderID} (${order.Quantity} box(es): ${order.FruitName}) has been accepted and dispatched for delivery!`;
    notifType = "ORDER_ACCEPTED";
    notifImg = "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop";
    actionTxt = "Track Order";
  } else if (targetStatus === "Rejected") {
    timelineTitle = "Order Rejected";
    notifTitle = `❌ Order Rejected #${order.OrderID}`;
    notifMsg = `Your order #${order.OrderID} (${order.Quantity} box(es): ${order.FruitName}) has been declined.`;
    notifType = "ORDER_REJECTED";
    actionTxt = "View Orders";
  } else if (targetStatus === "Delivered") {
    timelineTitle = "Order Delivered";
    notifTitle = `✅ Order Delivered #${order.OrderID}`;
    notifMsg = `Your order #${order.OrderID} (${order.Quantity} box(es): ${order.FruitName}) has been delivered successfully. Thank you for choosing us!`;
    notifType = "ORDER_DELIVERED";
    notifImg = "https://images.unsplash.com/photo-1546548970-71785318a17b?w=800&auto=format&fit=crop";
    actionTxt = "Rate Service";
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

  if (targetStatus === "Rejected" && order.Status !== "Rejected") {
    if (Array.isArray(order.Items) && order.Items.length > 0) {
      for (const item of order.Items) {
        await Fruit.findOneAndUpdate(
          { FruitID: item.FruitID }, 
          { $inc: { AvailableQuantity: Number(item.Quantity) } }
        );
      }
    } else if (order.FruitID) {
      await Fruit.findOneAndUpdate(
        { FruitID: order.FruitID }, 
        { $inc: { AvailableQuantity: Number(order.Quantity) } }
      );
    }
  }

  const notification = await Notification.create({
    recipientRole: "Retailer",
    recipientMobile: order.RetailerMobile,
    orderId: order.OrderID,
    title: notifTitle,
    message: notifMsg,
    type: notifType,
    imageUrl: notifImg,
    actionText: actionTxt,
    deepLink: "my-orders",
    isRead: false
  });

  const io = req.app.get("io");
  if (io) {
    io.to(`retailer_${order.RetailerMobile}`).emit("rich_push_advertisement", notification);
    io.to(`retailer_${order.RetailerMobile}`).emit("new_notification", notification);
    io.emit("order_updated", updatedOrder);
  }

  res.json(updatedOrder);
}
