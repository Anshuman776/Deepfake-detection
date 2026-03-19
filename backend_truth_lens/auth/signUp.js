const User = require("../models/userModel.js");
const { hashPassword } = require("../utils/hashPassword.js");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const ExpressError = require("../middlewares/expressError.js");
const trimInputs = (data) => {
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") {
      data[key] = data[key].trim();
    }
  });
  return data;
};

const signupHandler = async (req, res) => {
  try {
    let { email, password } = req.body;

    ({ email, password } = trimInputs({
      email,
      password,
    }));

    if (!email || !password) {
      throw new ExpressError(400, "All fields are required.");
    }

    email = email.toLowerCase();

    if (!emailRegex.test(email)) {
      throw new ExpressError(400, "Invalid email format.");
    }

    if (!passwordRegex.test(password)) {
      throw new ExpressError(
        400,
        "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character."
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ExpressError(409, "Email already registered.");
    }

    const hashedPassword = await hashPassword(password);

    await User.create({
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
    });

  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || "Something went wrong during signup.",
    });
  }
};

module.exports = signupHandler;