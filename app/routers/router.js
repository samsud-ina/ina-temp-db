const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth.js");

const version = require('../controllers/appVersionController.js');
router.get('/api/version/apps', version.checkVersion);

// const uploadController = require("../controllers/uploadController.js");
// router.post("/api/upload", auth.verifyToken, upload.single("file"), uploadController.upload);

module.exports = router;