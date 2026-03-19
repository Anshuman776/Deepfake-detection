const bcrypt = require("bcrypt");


const hashPassword = async (plainPassword) => {
  try {
    const saltRounds = 10; 
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    return hashed;
  } catch (err) {
    console.error("Error hashing password:", err);
    throw err;
  }
};

const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error("Error comparing password:", err);
    throw err;
  }
};

module.exports = { hashPassword, comparePassword };