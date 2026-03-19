const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const detectRoutes = require("./routes/detectRoute");
let authRoutes = null;
let historyRoutes = null;
let reportRoutes = null;

try {
  authRoutes = require("./auth/authRoutes");
  historyRoutes = require("./routes/historyRoute");
  reportRoutes = require("./routes/reportRoutes");
} catch (err) {
  console.warn("Optional routes skipped:", err.message);
}

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/",(req,res)=>{
  res.send("Welcome to TruthLens API");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "backend_truth_lens" });
});

app.use("/api/detect",detectRoutes);
if (authRoutes) {
  app.use("/api/auth",authRoutes);
}
if (historyRoutes) {
  app.use("/api/history",historyRoutes);
}
if (reportRoutes) {
  app.use("/api/report",reportRoutes);
}

module.exports = app;