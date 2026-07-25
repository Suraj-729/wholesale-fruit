import "dotenv/config";
import cors from "cors";
import express from "express";
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
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
process.on("unhandledRejection", (err) => console.error("Unhandled Rejection:", err));

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("Could not connect to MongoDB:", err));
} else {
  console.warn("MONGODB_URI is missing in environment variables!");
}

const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",") || [];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or allowed origins
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.get("/api/health", (_req, res) => res.json({ status: "ok", storage: "mongodb-atlas" }));
app.use("/api", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/fruits", fruitRoutes);
app.use("/api/retailers", retailerRoutes);
app.use("/api/orders", orderRoutes);

// Serve React frontend (production build)
const possibleDistPaths = [
  path.join(__dirname, "../dist"),
  path.join(__dirname, "dist"),
  path.join(process.cwd(), "dist")
];
let distPath = possibleDistPaths.find((p) => fs.existsSync(p)) || path.join(process.cwd(), "dist");

// If dist/index.html is not found, automatically trigger Vite build on startup
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

// For any non-API route, serve the React index.html (client-side routing)
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

app.listen(port, () => console.log(`FruitLane listening on port ${port}`));
