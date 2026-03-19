const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require("fs");

const width = 600;
const height = 400;

const chartCanvas = new ChartJSNodeCanvas({ width, height });

async function generateBarChart(scanId, aiProbability, trustScore) {

 const configuration = {
  type: 'bar',
  data: {
   labels: ['AI Probability', 'Trust Score'],
   datasets: [
    {
     label: 'Detection Metrics',
     data: [aiProbability * 100, trustScore],
     backgroundColor: [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)'
     ]
    }
   ]
  },
  options: {
   scales: {
    y: {
     beginAtZero: true,
     max: 100
    }
   }
  }
 };

 const buffer = await chartCanvas.renderToBuffer(configuration);

 const filePath = `reports/chart-${scanId}.png`;

 fs.writeFileSync(filePath, buffer);

 return filePath;
}

module.exports = generateBarChart;