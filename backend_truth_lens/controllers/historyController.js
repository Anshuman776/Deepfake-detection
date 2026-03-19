const Scan = require("../models/scanResult");

exports.getHistory = async(req,res)=>{

 const userId = req.user.id;

 const page = parseInt(req.query.page) || 1;
 const limit = 10;

 const filter = { user:userId };

 if(req.query.type){
  filter.type = req.query.type;
 }

 const scans = await Scan.find(filter)
  .sort({createdAt:-1})
  .skip((page-1)*limit)
  .limit(limit);

 const total = await Scan.countDocuments(filter);

 res.json({

  total,

  page,

  pages:Math.ceil(total/limit),

  history:scans

 });

};