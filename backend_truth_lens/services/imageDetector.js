const { detectWithMl } = require("./mlClient");

function detectImage({ filePath, remoteUrl }) {
	return detectWithMl({
		endpoint: "/api/detect/image",
		filePath,
		remoteUrl,
	});
}

module.exports = detectImage;
