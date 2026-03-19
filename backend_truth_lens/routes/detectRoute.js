const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploadMiddleware");
const detectController = require("../controllers/detectController");

router.post("/:type", upload.single("file"), detectController.detectMedia);
router.post("/upload", upload.single("file"), detectController.detectMedia);

module.exports = router;