const multer = require("multer");
const fs = require("fs");

fs.mkdirSync("uploads", { recursive: true });

const storage = multer.diskStorage({
 destination: "uploads/",
 filename:(req,file,cb)=>{
  cb(null,Date.now()+"-"+file.originalname);
 }
});

const upload = multer({
 storage,
 limits:{fileSize:500*1024*1024}  // 500 MB — supports large video files
});

module.exports = upload;