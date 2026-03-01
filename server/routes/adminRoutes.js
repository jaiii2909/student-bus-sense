const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');

router.post('/login', adminCtrl.login);

// route management
router.post('/routes', adminCtrl.addRoute);
router.get('/routes', adminCtrl.listRoutes);
router.put('/routes/:id', adminCtrl.updateRoute);
router.delete('/routes/:id', adminCtrl.deleteRoute);

// bus management
router.post('/buses', adminCtrl.addBus);
router.get('/buses', adminCtrl.listBuses);
router.put('/buses/:id', adminCtrl.updateBus);
router.delete('/buses/:id', adminCtrl.deleteBus);

// student administration
router.post('/students', adminCtrl.addStudent);
router.get('/students', adminCtrl.listStudents);
router.put('/students/:id/routes', adminCtrl.updateStudentRoutes);

// monitoring
router.get('/locations', adminCtrl.viewLocations);

module.exports = router;
