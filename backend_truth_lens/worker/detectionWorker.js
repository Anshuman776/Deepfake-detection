const { Worker } = require("bullmq");
const connection = require("../config/redis");

const Scan = require("../models/scanResult");

const detectImage = require("../services/ml.service");
const trustScore = require("../utils/trustScore");

const worker = new Worker(
 "detectionQueue",
 async job => {

  const { cloudUrl, type, fileHash, userId } = job.data;

  const result = await detectImage(cloudUrl);

  const trust = trustScore(result.ai_probability);

  await Scan.create({

   user:userId,

   fileHash,

   fileUrl:cloudUrl,

   type,

   aiProbability:result.ai_probability,

   trustScore:trust,

   verdict: result.ai_probability > 0.7
     ? "Likely AI Generated"
     : "Likely Human",

   analysis:result.analysis

  });

 },
 { connection }
);

console.log("Worker started");