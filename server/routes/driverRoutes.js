const express = require('express');
const router = express.Router();
const driverCtrl = require('../controllers/driverController');

router.post('/login', driverCtrl.login);
router.post('/buses/:busId/location', driverCtrl.shareLocation);

module.exports = router;
