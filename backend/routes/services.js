const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Get all services
router.get('/', serviceController.getAllServices);

// Get service by ID
router.get('/:id', serviceController.getServiceById);

// Add new service
router.post('/', serviceController.addService);

// Update service
router.put('/:id', serviceController.updateService);

// Delete service
router.delete('/:id', serviceController.deleteService);

// Check service status
router.post('/:id/check', serviceController.checkServiceStatus);

// Check all services
router.post('/check-all', serviceController.checkAllServices);

// Schedule daily check
router.post('/schedule-daily-check', serviceController.scheduleDailyCheck);

// Cancel daily check
router.post('/cancel-daily-check', serviceController.cancelDailyCheck);

module.exports = router;
