const { detectWithMl } = require("./mlClient");

function detectAudio({ filePath, remoteUrl }) {
	return detectWithMl({
		endpoint: "/api/detect/audio",
		filePath,
		remoteUrl,
	});
}

module.exports = detectAudio;
