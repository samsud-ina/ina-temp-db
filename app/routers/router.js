const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth.js");

const version = require('../controllers/versionController.js');
router.post('/api/version/apps', version.getVersion);

const authController = require('../controllers/authController.js');
router.post('/api/login', authController.login);
router.post('/api/register', authController.register);
router.post('/api/check-account', authController.checkAccount);
router.post('/api/reset-password', authController.resetPassword);

const user = require('../controllers/userController.js');
router.get('/api/user/all', auth.verifyToken, user.getUsers);
router.get('/api/user/detail', auth.verifyToken, user.getUserById);
router.get('/api/user/delete', auth.verifyToken, user.deleteUser);
router.post('/api/user/update-profile', auth.verifyToken, user.updateProfile);

const dashboard = require('../controllers/dashboardController.js');
router.get('/api/dashboard', auth.verifyToken, dashboard.getDashboardSummary);
router.post('/api/dashboard/dhuwit-summary', auth.verifyToken, dashboard.getDhuwitSummary);

const item = require('../controllers/itemController.js');
router.get('/api/item/all', auth.verifyToken, item.getItems);
router.post('/api/item/add', item.addItem);
router.post('/api/item/delete', item.deleteItem);

const amplop = require('../controllers/amplopController.js');
router.post('/api/amplop/list', auth.verifyToken, amplop.getDataAmplop);
router.post('/api/amplop/detail', auth.verifyToken, amplop.getDetailAmplop);
router.post('/api/amplop/create', auth.verifyToken, amplop.createAmplop);
router.post('/api/amplop/delete', auth.verifyToken, amplop.deleteAmplop);
router.post('/api/amplop/update', auth.verifyToken, amplop.updateAmplop);

const dhuwit = require('../controllers/dhuwitController.js');
router.post('/api/dhuwit/list', auth.verifyToken, dhuwit.getDataDhuwit);
router.post('/api/dhuwit/create', auth.verifyToken, dhuwit.createDhuwit);
router.post('/api/dhuwit/delete', auth.verifyToken, dhuwit.deleteDhuwit);
router.post('/api/dhuwit/update', auth.verifyToken, dhuwit.updateDhuwit);

router.post(
    '/api/dhuwit/create-from-text',
    auth.verifyToken,
    dhuwit.createFromText
);

// const uploadController = require("../controllers/uploadController.js");
// router.post("/api/upload", auth.verifyToken, upload.single("file"), uploadController.upload);

module.exports = router;