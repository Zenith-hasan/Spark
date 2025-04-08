const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const registerUser = async (req, res) => {
  try {
    const { userName, userEmail, password, role } = req.body;

    // Input validation
    if (!userName || !userEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!validator.isEmail(userEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ userEmail }, { userName }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User name or user email already exists",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      userName,
      userEmail,
      role: role || "user",
      password: hashPassword,
    });

    await newUser.save();

    // Generate tokens after successful registration
    const accessToken = jwt.sign(
      {
        _id: newUser._id,
        userName: newUser.userName,
        userEmail: newUser.userEmail,
        role: newUser.role,
      },
      process.env.JWT_SECRET || "JWT_SECRET",
      { expiresIn: "120m" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      data: {
        accessToken,
        user: {
          _id: newUser._id,
          userName: newUser.userName,
          userEmail: newUser.userEmail,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { userEmail, password } = req.body;

    if (!userEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const checkUser = await User.findOne({ userEmail });

    if (!checkUser || !(await bcrypt.compare(password, checkUser.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = jwt.sign(
      {
        _id: checkUser._id,
        userName: checkUser.userName,
        userEmail: checkUser.userEmail,
        role: checkUser.role,
      },
      process.env.JWT_SECRET || "JWT_SECRET",
      { expiresIn: "120m" }
    );

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        accessToken,
        user: {
          _id: checkUser._id,
          userName: checkUser.userName,
          userEmail: checkUser.userEmail,
          role: checkUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports = { registerUser, loginUser }; 