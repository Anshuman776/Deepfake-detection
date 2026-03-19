const express = require("express");
const router = express.Router();
const signup=require("../auth/signup");
const login=require("../auth/login");


router.post("/signup",signup);
router.post("/login",login);

module.exports = router;