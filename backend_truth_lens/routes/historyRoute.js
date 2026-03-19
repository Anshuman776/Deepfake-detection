const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware"); 
const { getHistory } = require("../controllers/historyController"); 

router.get("/history", authMiddleware, getHistory); 
module.exports = router;