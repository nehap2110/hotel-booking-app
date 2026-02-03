 const User = require('../models/user')
 const bcrypt = require('bcrypt')
 const jwt= require('jsonwebtoken');
 require('dotenv').config();

// exports.register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // validations
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters long",
//       });
//     }

//     // check existing user
//     const userExist = await User.findOne({ email });
//     if (userExist) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is already registered",
//       });
//     }

//     // hash password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // create user
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     user.password = undefined;

//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       user,
//     });

//   } catch (error) {
//     console.error("USER REGISTER FAILED:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to register user",
//     });
//   }
// };


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // validations
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // 🚫 Prevent superadmin registration
    if (role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Not allowed to register as superadmin",
      });
    }

    // check existing user
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ allow only "user" or "owner"
    let finalRole = "user";
    if (role === "owner") {
      finalRole = "owner";
    }

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
    });

    user.password = undefined;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });

  } catch (error) {
    console.error("USER REGISTER FAILED:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};



exports.login = async (req, res) => {
   console.log("login data",req.body)
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not registered. Please sign up",
      });
    }

    // password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // token
    const payload = {
      email: user.email,
      id: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    };

    return res
      .cookie("token", token, options)
      .status(200)
      .json({
        success: true,
        token,
        user,
        message: "Login successful",
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
