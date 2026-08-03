const express = require('express');
const router = express.Router();

const version = require('../controllers/appVersionController.js');
router.get('/version/check', version.checkVersion);
const upload = require('../middleware/upload.js');

const product = require('../controllers/productController.js');
router.get('/api/products', product.getProducts);
router.get('/api/product', product.getProduct);
router.post('/api/product/add', upload.single('image'), product.addProduct);
router.post('/api/product/update', upload.single('image'), product.updateProduct);
router.post('/api/product/delete', product.deleteProduct);

// const uploadController = require("../controllers/uploadController.js");
// router.post("/api/upload", auth.verifyToken, upload.single("file"), uploadController.upload);

module.exports = router;