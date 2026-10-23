const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/studentController');
const { requireRole } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

router.post('/login', loginLimiter, studentCtrl.login);
// legacy: every bus location, so admin only
router.get('/buses', requireRole('admin'), studentCtrl.viewBuses);
router.get('/:studentId/authorized-buses', requireRole('student'), studentCtrl.viewAuthorizedBuses);
// failed attempts count toward the login limit, so this can't be used to guess passwords
router.post('/password', requireRole('student'), loginLimiter, studentCtrl.changePassword);

module.exports = router;
