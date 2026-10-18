const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("database connected successfully");
  } catch (error) {
    console.log("database connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;