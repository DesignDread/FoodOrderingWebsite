import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to the food data file
const dataDir = path.join(process.cwd(), 'data');
const foodDataPath = path.join(dataDir, 'foods.json');

// Helper function to read food data
const readFoodData = async () => {
  try {
    await fs.access(foodDataPath);
    const data = await fs.readFile(foodDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to write food data
// const writeFoodData = async (data) => {
//   try {
//     // Ensure the data directory exists
//     await fs.mkdir(dataDir, { recursive: true });
//     await fs.writeFile(foodDataPath, JSON.stringify(data, null, 2));
//   } catch (error) {
//     throw new Error(`Error writing to food data file: ${error.message}`);
//   }
// };

// Validation function to ensure food object has all required fields
const validateFood = (food) => {
  const errors = [];
  
  // Check required fields
  if (!food.name) errors.push('Name is required');
  if (!food.desc) errors.push('Description is required');
  if (!Array.isArray(food.ingredients) || food.ingredients.length === 0) {
    errors.push('Ingredients must be a non-empty array');
  }
  
  // Set default values if needed
  if (!food.img) food.img = null;
  
  if (!food.price) {
    food.price = { org: 0.0, mrp: 0.0, off: 0 };
  } else {
    food.price.org = parseFloat(food.price.org || 0.0);
    food.price.mrp = parseFloat(food.price.mrp || 0.0);
    food.price.off = parseFloat(food.price.off || 0);
  }
  
  if (!Array.isArray(food.category)) {
    food.category = [];
  }
  
  return { isValid: errors.length === 0, errors, food };
};

// Food model functions
const Food = {
  // Create a new food item
  create: async (foodData) => {
    const { isValid, errors, food } = validateFood(foodData);
    
    if (!isValid) {
      throw new Error(`Invalid food data: ${errors.join(', ')}`);
    }
    
    const foods = await readFoodData();
    
    const newFood = {
      id: uuidv4(),
      ...food,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    foods.push(newFood);
    await writeFoodData(foods);
    
    return newFood;
  },
  
  // Find all food items with optional filter
  find: async (filter = {}) => {
    const foods = await readFoodData();
    
    // Apply filtering logic similar to your MongoDB queries
    return foods.filter(food => {
      // Filter by category
      if (filter.category && filter.category.$in) {
        const categories = filter.category.$in;
        if (!food.category.some(cat => categories.includes(cat))) {
          return false;
        }
      }
      
      // Filter by ingredients
      if (filter.ingredients && filter.ingredients.$in) {
        const ingredients = filter.ingredients.$in;
        if (!food.ingredients.some(ing => ingredients.includes(ing))) {
          return false;
        }
      }
      
      // Filter by price
      if (filter['price.org']) {
        const priceFilter = filter['price.org'];
        const foodPrice = food.price.org;
        
        if (priceFilter.$gte && foodPrice < priceFilter.$gte) return false;
        if (priceFilter.$lte && foodPrice > priceFilter.$lte) return false;
      }
      
      // Filter by search
      if (filter.$or) {
        const searchQueries = filter.$or;
        
        // Check if any search query matches
        const matchesSearch = searchQueries.some(query => {
          const field = Object.keys(query)[0];
          const regex = Object.values(query)[0].$regex;
          const pattern = new RegExp(regex.source, regex.flags);
          
          return pattern.test(food[field]);
        });
        
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  },
  
  // Find a food item by ID
  findById: async (id) => {
    const foods = await readFoodData();
    return foods.find(food => food.id === id) || null;
  },
  
  // Update a food item
  findByIdAndUpdate: async (id, updateData) => {
    const foods = await readFoodData();
    const index = foods.findIndex(food => food.id === id);
    
    if (index === -1) return null;
    
    const updatedFood = {
      ...foods[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    foods[index] = updatedFood;
    await writeFoodData(foods);
    
    return updatedFood;
  },
  
  // Delete a food item
    findByIdAndDelete: async (id) => {
      const foods = await readFoodData();
      const index = foods.findIndex(food => food.id === id);
      
      if (index === -1) return null;
      
      const deletedFood = foods[index];
      foods.splice(index, 1);
      await writeFoodData(foods);
      
      return deletedFood;
    }
  };


export default Food;