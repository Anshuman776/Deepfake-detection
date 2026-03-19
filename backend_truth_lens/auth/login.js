const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const { comparePassword } = require("../utils/hashPassword.js");
const ExpressError = require("../middlewares/expressError.js");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const loginHandler = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      throw new ExpressError("All fields are required", 400);
    }

    email = email.toLowerCase().trim();
    password = password.trim();

    if (!emailRegex.test(email)) {
      throw new ExpressError("Invalid email format.", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ExpressError("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ExpressError("Invalid email or password", 401);
    }
    const secret = process.env.JWT_SECRET;
console.log("JWT_SECRET:", secret); // <-- this should print your key

    if (!secret) {
      throw new ExpressError("JWT secret not defined", 500);
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: "7d" }
    );

    const isProd = (process.env.NODE_ENV || "development") === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    next(err); 
  }
};

module.exports = loginHandler;