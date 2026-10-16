const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

router.post('/login', adminCtrl.login);

// everything below needs an admin token
router.use(requireRole('admin'));

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
