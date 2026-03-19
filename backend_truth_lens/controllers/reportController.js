const Scan = require("../models/scanResult");
const generatePDFReport = require("../utils/pdfReport");

exports.downloadReport = async(req,res)=>{

 const scan = await Scan.findById(req.params.id);

 if(!scan){
   return res.status(404).json({message:"Scan not found"});
 }

 const filePath = `reports/report-${scan._id}.pdf`;

 generatePDFReport(scan,filePath);

 setTimeout(()=>{
   res.download(filePath);
 },500);

};