const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

async function generateHeatmapOverlay(imagePath, heatmap, outputPath) {

 const image = await loadImage(imagePath);

 const canvas = createCanvas(image.width, image.height);
 const ctx = canvas.getContext("2d");

 // draw original image
 ctx.drawImage(image, 0, 0);

 const rows = heatmap.length;
 const cols = heatmap[0].length;

 const blockWidth = image.width / cols;
 const blockHeight = image.height / rows;

 for(let i=0;i<rows;i++){

   for(let j=0;j<cols;j++){

     const value = heatmap[i][j];

     const red = Math.floor(255 * value);
     const blue = Math.floor(255 * (1-value));

     ctx.fillStyle = `rgba(${red},0,${blue},0.4)`;

     ctx.fillRect(
       j*blockWidth,
       i*blockHeight,
       blockWidth,
       blockHeight
     );

   }

 }

 const buffer = canvas.toBuffer("image/png");

 fs.writeFileSync(outputPath,buffer);

 return outputPath;

}

module.exports = generateHeatmapOverlay;