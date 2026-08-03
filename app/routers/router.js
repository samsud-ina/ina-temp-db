const express = require('express');
const router = express.Router();

const version = require('../controllers/appVersionController.js');
router.get('/version/check', version.checkVersion);

// const uploadController = require("../controllers/uploadController.js");
// router.post("/api/upload", auth.verifyToken, upload.single("file"), uploadController.upload);

module.exports = router;