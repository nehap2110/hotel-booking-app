
//const Hotel = require("../models/hotel.js");
const User = require("../models/user.js");
const jwt = require('jsonwebtoken')



exports.loggedin = async (req, res, next) => {
  console.log("token :",req.headers.authorization);
  try {
    let token;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ No token → unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Get user from DB (exclude password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    next(); // ✅ user authenticated
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid",
    });
  }
};


exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Platform owner access only" });
  }
  next();
};

exports.isOwner = (req, res, next) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ error: "Hotel owner access only" });
  }
  next();
};

exports.isUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ error: "User access only" });
  }
  next();
};
