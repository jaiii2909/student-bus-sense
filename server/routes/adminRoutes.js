const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

router.post('/login', loginLimiter, adminCtrl.login);

// everything below needs a current admin token
router.use(requireRole('admin'), adminCtrl.requireCurrentAdmin);

// failed attempts count toward the login limit
router.post('/password', loginLimiter, adminCtrl.changeOwnPassword);

// route management
router.post('/routes', adminCtrl.addRoute);
router.get('/routes', adminCtrl.listRoutes);
router.put('/routes/:id', adminCtrl.updateRoute);
router.put('/routes/:id/stops', adminCtrl.updateRouteStops);
router.delete('/routes/:id', adminCtrl.deleteRoute);

// bus management
router.post('/buses', adminCtrl.addBus);
router.get('/buses', adminCtrl.listBuses);
router.put('/buses/:id', adminCtrl.updateBus);
router.delete('/buses/:id', adminCtrl.deleteBus);

// student administration
router.post('/students', adminCtrl.addStudent);
router.post('/students/import', adminCtrl.importStudents);
router.get('/students', adminCtrl.listStudents);
router.put('/students/:id/routes', adminCtrl.updateStudentRoutes);
router.put('/students/:id/password', adminCtrl.resetStudentPassword);
router.delete('/students/:id', adminCtrl.deleteStudent);

// drivers and their trips
router.get('/drivers', adminCtrl.listDrivers);
router.post('/drivers', adminCtrl.addDriver);
router.put('/drivers/:id', adminCtrl.updateDriver);
router.put('/drivers/:id/password', adminCtrl.resetDriverPassword);
router.get('/trips', adminCtrl.listTrips);

// announcements
router.get('/announcements', adminCtrl.listAnnouncements);
router.post('/announcements', adminCtrl.addAnnouncement);
router.delete('/announcements/:id', adminCtrl.deleteAnnouncement);

// monitoring
router.get('/locations', adminCtrl.viewLocations);

module.exports = router;
