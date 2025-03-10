import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Path to the users data file
const dataDir = path.join(process.cwd(), 'data');
const usersDataPath = path.join(dataDir, 'users.json');

// Helper function to read users data
const readUsersData = async () => {
  try {
    await fs.access(usersDataPath);
    const data = await fs.readFile(usersDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Helper function to write users data
const writeUsersData = async (data) => {
  try {
    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(usersDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw new Error(`Error writing to users data file: ${error.message}`);
  }
};

// Helper function to read orders data (for validation)
const readOrdersData = async () => {
  try {
    const ordersDataPath = path.join(dataDir, 'orders.json');
    await fs.access(ordersDataPath);
    const data = await fs.readFile(ordersDataPath, 'utf8');
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

// Validation function to ensure user object has all required fields
const validateUser = async (user) => {
  const errors = [];
  
  // Check required fields
  if (!user.name) errors.push('Name is required');
  if (!user.email) errors.push('Email is required');
  
  // Validate email uniqueness
  if (user.email) {
    const users = await readUsersData();
    const existingUser = users.find(u => u.email === user.email && u.id !== user.id);
    if (existingUser) errors.push('Email already exists');
  }
  
  // Validate password
  if (!user.id && !user.password) {
    errors.push('Password is required for new users');
  }
  
  // Validate favourites
  if (user.favourites) {
    if (!Array.isArray(user.favourites)) {
      user.favourites = [];
    } else {
      const foods = await readFoodData();
      for (const foodId of user.favourites) {
        const foodExists = foods.some(food => food.id === foodId);
        if (!foodExists) errors.push(`Food with ID ${foodId} does not exist`);
      }
    }
  } else {
    user.favourites = [];
  }
  
  // Validate orders
  if (user.orders) {
    if (!Array.isArray(user.orders)) {
      user.orders = [];
    } else {
      const orders = await readOrdersData();
      for (const orderId of user.orders) {
        const orderExists = orders.some(order => order.id === orderId);
        if (!orderExists) errors.push(`Order with ID ${orderId} does not exist`);
      }
    }
  } else {
    user.orders = [];
  }
  
  // Validate cart items
  if (user.cart) {
    if (!Array.isArray(user.cart)) {
      user.cart = [];
    } else {
      const foods = await readFoodData();
      for (const item of user.cart) {
        if (!item.product) {
          errors.push('Product ID is required for each cart item');
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
  } else {
    user.cart = [];
  }
  
  return { isValid: errors.length === 0, errors, user };
};

// Password hashing function
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Users model functions
const Users = {
  // Create a new user
  create: async (userData) => {
    // Hash password before saving
    if (userData.password) {
      userData.password = hashPassword(userData.password);
    }
    
    const { isValid, errors, user } = await validateUser(userData);
    
    if (!isValid) {
      throw new Error(`Invalid user data: ${errors.join(', ')}`);
    }
    
    const users = await readUsersData();
    
    const newUser = {
      id: uuidv4(),
      ...user,
      img: user.img || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeUsersData(users);
    
    // Don't return password in response
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
  
  // Find all users with optional filter
  find: async (filter = {}) => {
    const users = await readUsersData();
    
    // Apply filtering logic
    return users.filter(user => {
      // Filter by email
      if (filter.email && user.email !== filter.email) {
        return false;
      }
      
      // Filter by name (partial match)
      if (filter.name && !user.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }
      
      return true;
    }).map(user => {
      // Remove password from results
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
  
  // Find a user by ID
  findById: async (id) => {
    const users = await readUsersData();
    const user = users.find(user => user.id === id);
    
    if (!user) return null;
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Find one user by filter
  findOne: async (filter = {}) => {
    const users = await readUsersData();
    
    const user = users.find(user => {
      if (filter.email && user.email !== filter.email) {
        return false;
      }
      if (filter.id && user.id !== filter.id) {
        return false;
      }
      return true;
    });
    
    if (!user) return null;
    
    // Only include password when specifically requested
    if (filter.includePassword) {
      return user;
    }
    
    // Don't return password by default
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Populate references in a user
  populate: async (user, paths) => {
    if (!user) return null;
    
    const populatedUser = { ...user };
    
    // Handle array of users
    if (Array.isArray(user)) {
      return Promise.all(user.map(u => Users.populate(u, paths)));
    }
    
    if (paths.includes('favourites') || paths === 'favourites') {
      const foods = await readFoodData();
      populatedUser.favourites = user.favourites.map(foodId => 
        foods.find(food => food.id === foodId) || foodId
      );
    }
    
    if (paths.includes('orders') || paths === 'orders') {
      const orders = await readOrdersData();
      populatedUser.orders = user.orders.map(orderId => 
        orders.find(order => order.id === orderId) || orderId
      );
    }
    
    if (paths.includes('cart.product') || paths === 'cart.product') {
      const foods = await readFoodData();
      populatedUser.cart = user.cart.map(item => {
        const product = foods.find(food => food.id === item.product);
        return {
          ...item,
          product: product || item.product
        };
      });
    }
    
    return populatedUser;
  },
  
  // Update a user
  findByIdAndUpdate: async (id, updateData) => {
    const users = await readUsersData();
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return null;
    
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = hashPassword(updateData.password);
    }
    
    const updatedUser = {
      ...users[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Validate the updated user
    const { isValid, errors } = await validateUser(updatedUser);
    if (!isValid) {
      throw new Error(`Invalid user update: ${errors.join(', ')}`);
    }
    
    users[index] = updatedUser;
    await writeUsersData(users);
    
    // Don't return password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },
  
  // Delete a user
  findByIdAndDelete: async (id) => {
    const users = await readUsersData();
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return null;
    
    const deletedUser = users[index];
    users.splice(index, 1);
    await writeUsersData(users);
    
    // Don't return password
    const { password, ...userWithoutPassword } = deletedUser;
    return userWithoutPassword;
  },
  
  // Authentication method
  authenticate: async (email, password) => {
    const users = await readUsersData();
    const user = users.find(user => user.email === email);
    
    if (!user) return null;
    
    // Check password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) return null;
    
    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Add to cart method
  addToCart: async (userId, productData) => {
    const users = await readUsersData();
    const index = users.findIndex(user => user.id === userId);
    
    if (index === -1) return null;
    
    const user = users[index];
    
    // Check if product already exists in cart
    const existingItemIndex = user.cart.findIndex(item => item.product === productData.product);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already in cart
      user.cart[existingItemIndex].quantity += productData.quantity || 1;
    } else {
      // Add new product to cart
      user.cart.push({
        product: productData.product,
        quantity: productData.quantity || 1
      });
    }
    
    user.updatedAt = new Date().toISOString();
    
    // Validate the updated user
    const { isValid, errors } = await validateUser(user);
    if (!isValid) {
      throw new Error(`Invalid cart update: ${errors.join(', ')}`);
    }
    
    users[index] = user;
    await writeUsersData(users);
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Remove from cart method
  removeFromCart: async (userId, productId) => {
    const users = await readUsersData();
    const index = users.findIndex(user => user.id === userId);
    
    if (index === -1) return null;
    
    const user = users[index];
    
    // Filter out the product
    user.cart = user.cart.filter(item => item.product !== productId);
    user.updatedAt = new Date().toISOString();
    
    users[index] = user;
    await writeUsersData(users);
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Add to favorites method
  addToFavorites: async (userId, foodId) => {
    const users = await readUsersData();
    const index = users.findIndex(user => user.id === userId);
    
    if (index === -1) return null;
    
    const user = users[index];
    
    // Check if food already in favorites
    if (!user.favourites.includes(foodId)) {
      user.favourites.push(foodId);
      user.updatedAt = new Date().toISOString();
      
      // Validate the updated user
      const { isValid, errors } = await validateUser(user);
      if (!isValid) {
        throw new Error(`Invalid favorites update: ${errors.join(', ')}`);
      }
      
      users[index] = user;
      await writeUsersData(users);
    }
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Remove from favorites method
  removeFromFavorites: async (userId, foodId) => {
    const users = await readUsersData();
    const index = users.findIndex(user => user.id === userId);
    
    if (index === -1) return null;
    
    const user = users[index];
    
    // Filter out the food
    user.favourites = user.favourites.filter(id => id !== foodId);
    user.updatedAt = new Date().toISOString();
    
    users[index] = user;
    await writeUsersData(users);
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

// Create a constructor function to mimic Mongoose model behavior
function UsersConstructor(userData) {
  Object.assign(this, userData);
  this.save = async function() {
    return Users.create(this);
  };
}

// Add static methods to the constructor
UsersConstructor.find = Users.find;
UsersConstructor.findById = Users.findById;
UsersConstructor.findOne = Users.findOne;
UsersConstructor.findByIdAndUpdate = Users.findByIdAndUpdate;
UsersConstructor.findByIdAndDelete = Users.findByIdAndDelete;
UsersConstructor.populate = Users.populate;
UsersConstructor.authenticate = Users.authenticate;
UsersConstructor.addToCart = Users.addToCart;
UsersConstructor.removeFromCart = Users.removeFromCart;
UsersConstructor.addToFavorites = Users.addToFavorites;
UsersConstructor.removeFromFavorites = Users.removeFromFavorites;

export default UsersConstructor;