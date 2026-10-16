const express = require('express');
const router = express.Router();
const driverCtrl = require('../controllers/driverController');
const { requireRole } = require('../middleware/auth');

router.post('/login', driverCtrl.login);
router.post('/buses/:busId/location', requireRole('driver'), driverCtrl.shareLocation);
router.post('/buses/:busId/stop', requireRole('driver'), driverCtrl.stopSharing);

module.exports = router;
