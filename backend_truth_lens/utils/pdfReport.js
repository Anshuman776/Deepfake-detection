const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateBarChart = require("./chartGenerator");
const generateHeatmap = require("./heatmapOverlay");

async function generatePDFReport(scan, filePath){

 const doc = new PDFDocument();

 doc.pipe(fs.createWriteStream(filePath));

 const chartPath = await generateBarChart(
  scan._id,
  scan.aiProbability,
  scan.trustScore
 );

 const heatmapPath = await generateHeatmap(scan._id);

 doc.fontSize(22).text("AI Detection Report",{align:"center"});

 doc.moveDown();

 doc.fontSize(12).text(`Scan ID: ${scan._id}`);
 doc.text(`File Type: ${scan.type}`);
 doc.text(`Date: ${scan.createdAt}`);

 doc.moveDown();

 doc.fontSize(16).text("Detection Result");

 doc.text(`AI Probability: ${(scan.aiProbability*100).toFixed(2)}%`);
 doc.text(`Trust Score: ${scan.trustScore}`);
 doc.text(`Verdict: ${scan.verdict}`);

 doc.moveDown();

 doc.fontSize(16).text("Detection Metrics Chart");

 doc.image(chartPath,{
  width:450,
  align:"center"
 });

 doc.moveDown();

 doc.fontSize(16).text("AI Artifact Heatmap");

 doc.image(heatmapPath,{
  width:450,
  align:"center"
 });

 doc.moveDown();

 doc.fontSize(16).text("Analysis");

 scan.analysis.forEach(item=>{
  doc.text(`• ${item}`);
 });

 doc.end();
}

module.exports = generatePDFReport;