const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/studentController');
const { requireRole } = require('../middleware/auth');

router.post('/login', studentCtrl.login);
// legacy: every bus location, so admin only
router.get('/buses', requireRole('admin'), studentCtrl.viewBuses);
router.get('/:studentId/authorized-buses', requireRole('student'), studentCtrl.viewAuthorizedBuses);

module.exports = router;
