const express = require('express');
const router = express.Router();
const studentCtrl = require('../controllers/studentController');

router.post('/login', studentCtrl.login);
router.get('/buses', studentCtrl.viewBuses);
router.get('/:studentId/authorized-buses', studentCtrl.viewAuthorizedBuses);

module.exports = router;
