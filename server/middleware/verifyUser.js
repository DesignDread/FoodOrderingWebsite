import jwt from "jsonwebtoken";
import { createError } from "../error.js";

export const verifyToken = async (req, res, next) => {
  console.log("inside verifyToken middleware");
  console.log("Received Token:", req.headers.authorization);

  try {
    if (!req.headers.authorization) {
      console.log("No authorization header found");
      return next(createError(401, "You are not authenticated!"));
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      console.log("No token found in authorization header");
      return next(createError(401, "You are not authenticated!"));
    }
    
    const decoded = jwt.verify(token, process.env.JWT);
    console.log("Token decoded successfully", decoded);
    
    // The only real change is that your user IDs are now stored as 'id' rather 
    // than '_id' (which was the MongoDB convention)
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id // Handle both formats for backward compatibility
    };
    console.log("USER IS VERIFIED", req.user);
    return next();
  } catch (err) {
    console.log("Error during token verification", err);
    // Handle specific JWT errors if desired
    if (err.name === 'JsonWebTokenError') {
      console.log("Invalid token error");
      return next(createError(401, "Invalid token!"));
    }
    if (err.name === 'TokenExpiredError') {
      console.log("Token expired error");
      return next(createError(401, "Token has expired!"));
    }
    
    next(err);
  }
};