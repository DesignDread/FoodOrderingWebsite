import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import UserRoutes from "./routes/User.js";
import FoodRoutes from "./routes/Food.js";
import fs from 'fs/promises';
import path from 'path';
import morgan from 'morgan';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true })); // for form data

app.use("/api/user/", UserRoutes);
app.use("/api/food/", FoodRoutes);

// error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({
    success: false,
    status,
    message,
  });
});

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Hello developers from GFG",
  });
});

// Initialize data directory and files if they don't exist
const initializeDataStorage = async () => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Create data directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true });
    
    // Initialize empty data files if they don't exist
    const files = ['users.json', 'foods.json', 'orders.json'];
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      try {
        await fs.access(filePath);
        console.log(`${file} exists`);
      } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
        console.log(`Created empty ${file}`);
      }
    }
    
    console.log("Data storage initialized successfully");
  } catch (error) {
    console.error("Failed to initialize data storage:");
    console.error(error);
  }
};

const startServer = async () => {
  try {
    // Initialize JSON data storage instead of connecting to MongoDB
    await initializeDataStorage();
    
    app.listen(8080, () => console.log("Server started on port 8080"));
  } catch (error) {
    console.log(error);
  }
};

startServer();