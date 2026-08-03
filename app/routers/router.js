const express = require('express');
const router = express.Router();

const version = require('../controllers/appVersionController.js');
router.get('/version/check', version.checkVersion);
const upload = require('../middleware/upload.js');

const product = require('../controllers/productController.js');
router.get('/products', product.getProducts);
router.get('/product', product.getProduct);
router.post('/product/add', upload.single('image'), product.addProduct);
router.post('/product/update', upload.single('image'), product.updateProduct);
router.post('/product/delete', product.deleteProduct);

const taxService = require('../controllers/taxServiceController.js');
router.get('/tax-service', taxService.getTaxService);
router.post('/tax-service/save', taxService.saveTaxServices);

// const uploadController = require("../controllers/uploadController.js");
// router.post("/upload", auth.verifyToken, upload.single("file"), uploadController.upload);

module.exports = router;