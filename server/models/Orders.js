import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to the orders data file
const dataDir = path.join(process.cwd(), 'data');
const ordersDataPath = path.join(dataDir, 'orders.json');

// Helper function to read orders data
const readOrdersData = async () => {
  try {
    await fs.access(ordersDataPath);
    const data = await fs.readFile(ordersDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to write orders data
const writeOrdersData = async (data) => {
  try {
    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(ordersDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`Error writing to orders data file: ${error.message}`);
  }
};

// Helper function to read users data (for validation)
const readUsersData = async () => {
  try {
    const usersDataPath = path.join(dataDir, 'users.json');
    await fs.access(usersDataPath);
    const data = await fs.readFile(usersDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to read food data (for validation)
const readFoodData = async () => {
  try {
    const foodDataPath = path.join(dataDir, 'foods.json');
    await fs.access(foodDataPath);
    const data = await fs.readFile(foodDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Validation function to ensure order object has all required fields
const validateOrder = async (order) => {
  const errors = [];
  
  // Check required fields
  if (order.total_amount === undefined) errors.push('Total amount is required');
  if (!order.address) errors.push('Address is required');
  if (!order.user) errors.push('User ID is required');
  
  // Validate user exists
  if (order.user) {
    const users = await readUsersData();
    const userExists = users.some(user => user.id === order.user);
    if (!userExists) errors.push('User does not exist');
  }
  
  // Validate products
  if (!Array.isArray(order.products) || order.products.length === 0) {
    errors.push('Products must be a non-empty array');
  } else {
    const foods = await readFoodData();
    for (const item of order.products) {
      if (!item.product) {
        errors.push('Product ID is required for each order item');
      } else {
        const productExists = foods.some(food => food.id === item.product);
        if (!productExists) errors.push(`Product with ID ${item.product} does not exist`);
      }
      
      // Set default quantity if needed
      if (!item.quantity || item.quantity < 1) {
        item.quantity = 1;
      }
    }
  }
  
  // Set default status if needed
  if (!order.status) {
    order.status = "Payment Done";
  }
  
  return { isValid: errors.length === 0, errors, order };
};

// Orders model functions
const Orders = {
  // Create a new order
  create: async (orderData) => {
    const { isValid, errors, order } = await validateOrder(orderData);
    
    if (!isValid) {
      throw new Error(`Invalid order data: ${errors.join(', ')}`);
    }
    
    const orders = await readOrdersData();
    
    const newOrder = {
      id: uuidv4(),
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    await writeOrdersData(orders);
    
    return newOrder;
  },
  
  // Find all orders with optional filter
  find: async (filter = {}) => {
    const orders = await readOrdersData();
    
    // Apply filtering logic similar to MongoDB queries
    return orders.filter(order => {
      // Filter by user
      if (filter.user && order.user !== filter.user) {
        return false;
      }
      
      // Filter by status
      if (filter.status && order.status !== filter.status) {
        return false;
      }
      
      return true;
    });
  },
  
  // Find an order by ID
  findById: async (id) => {
    const orders = await readOrdersData();
    return orders.find(order => order.id === id) || null;
  },
  
  // Populate references in an order
  // This is similar to Mongoose's populate function
  populate: async (order, paths) => {
    if (!order) return null;
    
    const populatedOrder = { ...order };
    
    // Handle array of orders
    if (Array.isArray(order)) {
      return Promise.all(order.map(o => Orders.populate(o, paths)));
    }
    
    if (paths.includes('user') || paths === 'user') {
      const users = await readUsersData();
      const user = users.find(u => u.id === order.user);
      if (user) {
        // Don't include password in populated user
        const { password, ...userWithoutPassword } = user;
        populatedOrder.user = userWithoutPassword;
      }
    }
    
    if (paths.includes('products.product') || paths === 'products.product') {
      const foods = await readFoodData();
      populatedOrder.products = order.products.map(item => {
        const product = foods.find(food => food.id === item.product);
        return {
          ...item,
          product: product || item.product
        };
      });
    }
    
    return populatedOrder;
  },
  
  // Update an order
  findByIdAndUpdate: async (id, updateData) => {
    const orders = await readOrdersData();
    const index = orders.findIndex(order => order.id === id);
    
    if (index === -1) return null;
    
    const updatedOrder = {
      ...orders[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Validate the updated order
    const { isValid, errors } = await validateOrder(updatedOrder);
    if (!isValid) {
      throw new Error(`Invalid order update: ${errors.join(', ')}`);
    }
    
    orders[index] = updatedOrder;
    await writeOrdersData(orders);
    
    return updatedOrder;
  },
  
  // Delete an order
  findByIdAndDelete: async (id) => {
    const orders = await readOrdersData();
    const index = orders.findIndex(order => order.id === id);
    
    if (index === -1) return null;
    
    const deletedOrder = orders[index];
    orders.splice(index, 1);
    await writeOrdersData(orders);
    
    return deletedOrder;
  },
  
  // Save method for a new order instance (similar to Mongoose's save)
  save: async function() {
    return Orders.create(this);
  }
};

// Create a constructor function to mimic Mongoose model behavior
function OrdersConstructor(orderData) {
  Object.assign(this, orderData);
  this.save = async function() {
    return Orders.create(this);
  };
}

// Add static methods to the constructor
OrdersConstructor.find = Orders.find;
OrdersConstructor.findById = Orders.findById;
OrdersConstructor.findByIdAndUpdate = Orders.findByIdAndUpdate;
OrdersConstructor.findByIdAndDelete = Orders.findByIdAndDelete;
OrdersConstructor.populate = Orders.populate;

export default OrdersConstructor;