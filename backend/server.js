import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import morgan from "morgan";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import fruitRoutes from "./routes/fruitRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import { initPushScheduler } from "./services/pushScheduler.js";
import User from "./models/User.js";
import Fruit from "./models/Fruit.js";
import Banner from "./models/Banner.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",") || [];
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join", (data) => {
    if (!data) return;
    const { role, retailerMobile } = data;
    if (role === "Admin") {
      socket.join("admin");
      console.log(`Socket ${socket.id} joined room: admin`);
    } else if (role === "Retailer" && retailerMobile) {
      const room = `retailer_${retailerMobile}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));

async function ensureSeedData() {
  try {
    const adminExists = await User.findOne({ Role: { $regex: /^admin$/i } });
    if (!adminExists) {
      await User.create({
        Username: "admin",
        Password: "ChangeMe123!",
        Role: "Admin"
      });
      console.log("Default admin account created: admin / ChangeMe123!");
    }

    const fruitCount = await Fruit.countDocuments();
    if (fruitCount === 0) {
      await Fruit.insertMany([
        { FruitID: "FR001", FruitName: "Kashmiri Gala Apples", PackageType: "20 KG Box", AvailableQuantity: 70, Price: 2180, CreatedDate: new Date().toISOString() },
        { FruitID: "FR002", FruitName: "Yelakki Golden Banana", PackageType: "18 KG Crate", AvailableQuantity: 90, Price: 920, CreatedDate: new Date().toISOString() },
        { FruitID: "FR003", FruitName: "Alphonso Mangoes", PackageType: "6 Dozen Carton", AvailableQuantity: 45, Price: 3650, CreatedDate: new Date().toISOString() }
      ]);
      console.log("Initial fruit inventory seeded into MongoDB Atlas.");
    }

    const bannerCount = await Banner.countDocuments();
    if (bannerCount === 0) {
      await Banner.insertMany([
        {
          title: "Holi Wholesale Mahotsav 🎨",
          subtitle: "FLAT 50% OFF on Kashmiri Gala Apple Crates! Order 10+ boxes for free morning delivery.",
          tag: "HOLI 50% OFF",
          bgGradient: "emerald",
          buttonText: "Shop Wholesale Crates"
        },
        {
          title: "Diwali Wholesale Dhamaka ✨",
          subtitle: "Massive Discounts on Bulk Alphonso Mango Crates & Festive Gift Boxes for Shops!",
          tag: "DIWALI SPECIAL",
          bgGradient: "diwali",
          buttonText: "Claim Diwali Deal"
        },
        {
          title: "New Year Fresh Stock Deals 🎉",
          subtitle: "Get Extra 20% Cashback on All COD Wholesale Crate Purchases for Registered Retailers.",
          tag: "NEW YEAR DEAL",
          bgGradient: "emerald",
          buttonText: "Order Bulk Stock"
        },
        {
          title: "Weekend Flash Crate Sale ⚡",
          subtitle: "Limited Stock: Premium Yelakki Bananas starting at just ₹800 / 18KG Crate!",
          tag: "FLASH SALE",
          bgGradient: "sunset",
          buttonText: "Buy Before Stock Ends"
        },
        {
          title: "Fresh Market Sunrise Delivery 🌾",
          subtitle: "Order before 10:00 PM for 6:00 AM Guaranteed Shop Delivery across the city.",
          tag: "SALE COMING SOON",
          bgGradient: "midnight",
          buttonText: "Pre-Order Market Stock"
        },
        {
          title: "Buy 5 Crates, Get 1 Free Crate 🔥",
          subtitle: "Exclusive Wholesale Crate Offer on Nagpur Oranges & Seedless Grape Lots for Retailers!",
          tag: "BULK SAVINGS",
          bgGradient: "holi",
          buttonText: "Claim Free Crate Deal"
        }
      ]);
      console.log("6 B2B Wholesale offer banners seeded into MongoDB.");
    }
  } catch (err) {
    console.error("Could not seed data into MongoDB:", err.message);
  }
}

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB Atlas");
      ensureSeedData();
      initPushScheduler(app);
    })
    .catch((err) => console.error("Could not connect to MongoDB:", err));
} else {
  console.warn("MONGODB_URI is missing in environment variables!");
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  }
}));

// Express body parser limit increased to 5MB to handle up to 2MB base64 uploads
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(morgan("dev"));

// API routes
app.get("/api/health", (_req, res) => res.json({ status: "ok", storage: "mongodb-atlas" }));
app.use("/api", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/fruits", fruitRoutes);
app.use("/api/retailers", retailerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/banners", bannerRoutes);

// Serve React frontend (production build)
const possibleDistPaths = [
  path.join(__dirname, "../dist"),
  path.join(__dirname, "dist"),
  path.join(process.cwd(), "dist")
];
let distPath = possibleDistPaths.find((p) => fs.existsSync(p)) || path.join(process.cwd(), "dist");

if (!fs.existsSync(path.join(distPath, "index.html"))) {
  console.log("dist/index.html not found. Building frontend now...");
  try {
    const rootDir = fs.existsSync(path.join(__dirname, "../package.json")) ? path.join(__dirname, "..") : process.cwd();
    execSync("npx vite build", { stdio: "inherit", cwd: rootDir });
    distPath = possibleDistPaths.find((p) => fs.existsSync(p)) || distPath;
  } catch (err) {
    console.error("Auto build failed:", err.message);
  }
}

app.use(express.static(distPath));

app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("API server is running, but frontend build (dist/index.html) is missing. Please run 'npm run build' on the server.");
  }
});

app.use(notFound);
app.use(errorHandler);

server.listen(port, () => console.log(`FruitLane listening with Socket.IO on port ${port}`));
