import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid

// Path to JSON file - create a data directory in your project root
const dataDir = path.join(process.cwd(), 'data');
const foodDataPath = path.join(dataDir, 'foods.json');

// Helper function to read food data from JSON file
const readFoodData = async () => {
  try {
    await fs.access(foodDataPath);
    const data = await fs.readFile(foodDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return an empty array
    return [];
  }
};

// Helper function to write food data to JSON file
const writeFoodData = async (data) => {
  try {
    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(foodDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`Error writing to food data file: ${error.message}`);
  }
};

// Add food products
export const addProducts = async (req, res, next) => {
  try {
    const foodData = req.body;
    if (!Array.isArray(foodData)) {
      return res.status(400).json({
        message: "Invalid request. Expected an array of foods."
      });
    }

    // Read existing data
    const existingFoods = await readFoodData();
    const createdFoods = [];

    for (const foodInfo of foodData) {
      const { name, desc, img, price, ingredients, category } = foodInfo;
      const newFood = {
        id: uuidv4(), // Generate unique ID for each food item
        name,
        desc,
        img,
        price,
        ingredients,
        category,
        createdAt: new Date().toISOString()
      };
      
      existingFoods.push(newFood);
      createdFoods.push(newFood);
    }

    // Write updated data back to file
    await writeFoodData(existingFoods);

    return res.status(201).json({
      message: "Products added successfully",
      createdFoods
    });
  } catch (err) {
    next(err);
  }
};

// Get food items with filtering
export const getFoodItems = async (req, res, next) => {
  try {
    let { categories, minPrice, maxPrice, ingredients, search } = req.query;
    
    // Convert comma-separated strings to arrays
    ingredients = ingredients?.split(",");
    categories = categories?.split(",");
    
    // Get all foods
    let foodList = await readFoodData();
    
    // Apply filters
    if (categories && categories.length > 0) {
      foodList = foodList.filter(food => categories.includes(food.category));
    }
    
    if (ingredients && ingredients.length > 0) {
      foodList = foodList.filter(food => 
        food.ingredients.some(ingredient => ingredients.includes(ingredient))
      );
    }
    
    if (minPrice || maxPrice) {
      foodList = foodList.filter(food => {
        const foodPrice = parseFloat(food.price.org);
        if (minPrice && foodPrice < parseFloat(minPrice)) return false;
        if (maxPrice && foodPrice > parseFloat(maxPrice)) return false;
        return true;
      });
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      foodList = foodList.filter(food => 
        searchRegex.test(food.name) || searchRegex.test(food.desc)
      );
    }

    return res.status(200).json(foodList);
  } catch (err) {
    next(err);
  }
};

// Get food by ID
export const getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const foods = await readFoodData();
    const food = foods.find(item => item.id === id);
    
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }
    
    return res.status(200).json(food);
  } catch (err) {
    next(err);
  }
};