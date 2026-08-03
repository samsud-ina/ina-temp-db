const multer = require('multer');

const storage = multer.memoryStorage();

function imageFilter(req, file, cb) {
	if (!file.mimetype || !file.mimetype.startsWith('image/')) {
		return cb(new Error('Only image files are allowed'));
	}

	return cb(null, true);
}

const uploadFile = multer({
	storage,
	fileFilter: imageFilter,
	limits: {
		fileSize: 5 * 1024 * 1024
	}
});

module.exports = uploadFile;