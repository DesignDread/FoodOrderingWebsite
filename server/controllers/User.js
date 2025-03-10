import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createError } from "../error.js";

dotenv.config();

// Define paths for JSON data files
const dataDir = path.join(process.cwd(), 'data');
const usersDataPath = path.join(dataDir, 'users.json');
const ordersDataPath = path.join(dataDir, 'orders.json');

// Helper functions for file operations
const ensureDataDirExists = async () => {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    throw new Error(`Error creating data directory: ${error.message}`);
  }
};

const readUsersData = async () => {
  try {
    await fs.access(usersDataPath);
    const data = await fs.readFile(usersDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return an empty array
    return [];
  }
};

const writeUsersData = async (data) => {
  await ensureDataDirExists();
  await fs.writeFile(usersDataPath, JSON.stringify(data, null, 2));
};

const readOrdersData = async () => {
  try {
    await fs.access(ordersDataPath);
    const data = await fs.readFile(ordersDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return an empty array
    return [];
  }
};

const writeOrdersData = async (data) => {
  await ensureDataDirExists();
  await fs.writeFile(ordersDataPath, JSON.stringify(data, null, 2));
};

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

// Auth

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;
    
    // Read existing users
    const users = await readUsersData();
    
    // Check for existing user
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      img,
      cart: [],
      favourites: [],
      createdAt: new Date().toISOString()
    };
    
    // Add user to array and save
    users.push(newUser);
    await writeUsersData(users);
    
    // Create and return token
    const token = jwt.sign({ id: newUser.id }, process.env.JWT, {
      expiresIn: "9999 years",
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Read users
    const users = await readUsersData();
    
    // Check for existing user
    const user = users.find(user => user.email === email);
    if (!user) {
      return next(createError(409, "User not found."));
    }
    
    const isPasswordCorrect = await bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT, {
      expiresIn: "9999 years",
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({ token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

// Cart

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userJWT = req.user;
    
    // Read users
    const users = await readUsersData();
    const userIndex = users.findIndex(user => user.id === userJWT.id);
    
    if (userIndex === -1) {
      return next(createError(404, "User not found"));
    }
    
    const user = users[userIndex];
    
    // Find if product already in cart
    const existingCartItemIndex = user.cart.findIndex(item => 
      item.product === productId
    );
    
    if (existingCartItemIndex !== -1) {
      // Product is already in the cart, update the quantity
      user.cart[existingCartItemIndex].quantity += quantity;
    } else {
      // Product is not in the cart, add it
      user.cart.push({ product: productId, quantity });
    }
    
    // Save updated users
    await writeUsersData(users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return res
      .status(200)
      .json({ message: "Product added to cart successfully", user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userJWT = req.user;
    
    // Read users
    const users = await readUsersData();
    const userIndex = users.findIndex(user => user.id === userJWT.id);
    
    if (userIndex === -1) {
      return next(createError(404, "User not found"));
    }
    
    const user = users[userIndex];
    
    // Find product in cart
    const productIndex = user.cart.findIndex(item => item.product === productId);
    
    if (productIndex !== -1) {
      if (quantity && quantity > 0) {
        user.cart[productIndex].quantity -= quantity;
        if (user.cart[productIndex].quantity <= 0) {
          user.cart.splice(productIndex, 1); // Remove the product from the cart
        }
      } else {
        user.cart.splice(productIndex, 1);
      }
      
      // Save updated users
      await writeUsersData(users);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return res
        .status(200)
        .json({ message: "Product quantity updated in cart", user: userWithoutPassword });
    } else {
      return next(createError(404, "Product not found in the user's cart"));
    }
  } catch (err) {
    next(err);
  }
};

export const getAllCartItems = async (req, res, next) => {
  try {
    const userJWT = req.user;
    
    // Read users and foods
    const users = await readUsersData();
    const foods = await readFoodData();
    
    const user = users.find(user => user.id === userJWT.id);
    
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    // Populate cart items with product details
    const cartItems = user.cart.map(cartItem => {
      const product = foods.find(food => food.id === cartItem.product);
      return {
        product,
        quantity: cartItem.quantity
      };
    });
    
    return res.status(200).json(cartItems);
  } catch (err) {
    next(err);
  }
};

// Orders

export const placeOrder = async (req, res, next) => {
  try {
    const { products, address, totalAmount } = req.body;
    const userJWT = req.user;
    
    // Read users and orders
    const users = await readUsersData();
    const orders = await readOrdersData();
    
    const userIndex = users.findIndex(user => user.id === userJWT.id);
    
    if (userIndex === -1) {
      return next(createError(404, "User not found"));
    }
    
    // Create new order
    const newOrder = {
      id: uuidv4(),
      products,
      user: userJWT.id,
      total_amount: totalAmount,
      address,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    // Add order to orders array
    orders.push(newOrder);
    await writeOrdersData(orders);
    
    // Clear user's cart
    users[userIndex].cart = [];
    await writeUsersData(users);
    
    return res
      .status(200)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (err) {
    next(err);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const userJWT = req.user;
    
    // Read orders
    const orders = await readOrdersData();
    
    // Filter orders by user
    const userOrders = orders.filter(order => order.user === userJWT.id);
    
    return res.status(200).json(userOrders);
  } catch (err) {
    next(err);
  }
};

// Favorites

export const addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userJWT = req.user;
    
    // Read users
    const users = await readUsersData();
    const userIndex = users.findIndex(user => user.id === userJWT.id);
    
    if (userIndex === -1) {
      return next(createError(404, "User not found"));
    }
    
    const user = users[userIndex];
    
    // Check if product is already in favorites
    if (!user.favourites.includes(productId)) {
      user.favourites.push(productId);
      await writeUsersData(users);
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return res
      .status(200)
      .json({ message: "Product added to favorites successfully", user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

export const removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userJWT = req.user;
    
    // Read users
    const users = await readUsersData();
    const userIndex = users.findIndex(user => user.id === userJWT.id);
    
    if (userIndex === -1) {
      return next(createError(404, "User not found"));
    }
    
    const user = users[userIndex];
    
    // Remove product from favorites
    user.favourites = user.favourites.filter(fav => fav !== productId);
    await writeUsersData(users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return res
      .status(200)
      .json({ message: "Product removed from favorites successfully", user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
};

export const getUserFavorites = async (req, res, next) => {
  try {
    const userJWT = req.user;
    
    // Read users and foods
    const users = await readUsersData();
    const foods = await readFoodData();
    
    const user = users.find(user => user.id === userJWT.id);
    
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    // Populate favorites with product details
    const favoriteProducts = user.favourites.map(favId => 
      foods.find(food => food.id === favId)
    ).filter(Boolean); // Filter out any undefined products
    
    return res.status(200).json(favoriteProducts);
  } catch (err) {
    next(err);
  }
};