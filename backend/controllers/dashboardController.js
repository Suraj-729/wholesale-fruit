import Fruit from "../models/Fruit.js";
import Retailer from "../models/Retailer.js";
import Order from "../models/Order.js";

export async function dashboard(req, res) {
  const [fruits, retailers, orders] = await Promise.all([Fruit.find(), Retailer.find(), Order.find()]);
  const today = new Date().toISOString().slice(0, 10);
  const lowThreshold = Number(process.env.LOW_STOCK_THRESHOLD || 10);
  res.json({
    totals: {
      fruits: fruits.length,
      availableBoxes: fruits.reduce((sum, fruit) => sum + (Number(fruit.AvailableQuantity) || 0), 0),
      retailers: retailers.length,
      pendingOrders: orders.filter((order) => order.Status === "Pending").length,
      deliveredOrders: orders.filter((order) => order.Status === "Delivered").length,
      cancelledOrders: orders.filter((order) => order.Status === "Cancelled").length,
      todayOrders: orders.filter((order) => order.OrderDate.startsWith(today)).length,
    },
    recentOrders: orders.sort((a, b) => b.OrderDate.localeCompare(a.OrderDate)).slice(0, 10),
    lowStock: fruits.filter((fruit) => Number(fruit.AvailableQuantity) <= lowThreshold),
  });
}
