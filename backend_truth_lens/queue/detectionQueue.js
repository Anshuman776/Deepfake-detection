const {Queue} = require("bullmq");
const connection = require("../config/redis");

const detectionQueue = new Queue("detection",{connection});

module.exports = detectionQueue;