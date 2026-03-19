const { detectWithMl } = require("./mlClient");

function detectVideo({ filePath, remoteUrl }) {
	return detectWithMl({
		endpoint: "/api/detect/video",
		filePath,
		remoteUrl,
	});
}

module.exports = detectVideo;
