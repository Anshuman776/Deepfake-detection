function calculateTrust(aiProbability){

  return Math.round((1 - aiProbability) * 100);

}

module.exports = calculateTrust;