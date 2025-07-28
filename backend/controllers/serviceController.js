const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const scheduler = require('../utils/scheduler');

const CONFIG_FILE = path.join(__dirname, '../../config/services.json');

// Helper function to read services from file
async function readServices() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading services file:', error);
    return [];
  }
}

// Helper function to write services to file
async function writeServices(services) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(services, null, 2));
  } catch (error) {
    console.error('Error writing services file:', error);
  }
}

// Check service status
async function checkService(url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return {
      status: response.status === 200 ? 'up' : 'down',
      responseTime: response.headers['response-time'] || null
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}

// Get all services
async function getAllServices(req, res) {
  try {
    const services = await readServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
}

// Get service by ID
async function getServiceById(req, res) {
  try {
    const services = await readServices();
    const service = services.find(s => s.id === parseInt(req.params.id));
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve service' });
  }
}

// Add new service
async function addService(req, res) {
  try {
    const services = await readServices();
    const newService = {
      id: services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1,
      name: req.body.name,
      url: req.body.url,
      interval: req.body.interval || '60 seconds',
      auth: req.body.auth || null, // Add auth field
      status: 'unknown',
      lastChecked: null
    };
    
    services.push(newService);
    await writeServices(services);
    
    // Schedule the new service
    scheduler.scheduleService(newService);
    
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add service' });
  }
}

// Update service
async function updateService(req, res) {
  try {
    const services = await readServices();
    const serviceIndex = services.findIndex(s => s.id === parseInt(req.params.id));
    
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const updatedService = {
      ...services[serviceIndex],
      name: req.body.name || services[serviceIndex].name,
      url: req.body.url || services[serviceIndex].url,
      interval: req.body.interval || services[serviceIndex].interval,
      auth: req.body.auth || services[serviceIndex].auth || null
    };
    
    services[serviceIndex] = updatedService;
    await writeServices(services);
    
    // Reschedule the updated service
    scheduler.rescheduleService(updatedService);
    
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
}

// Delete service
async function deleteService(req, res) {
  try {
    const services = await readServices();
    const serviceIndex = services.findIndex(s => s.id === parseInt(req.params.id));
    
    if (serviceIndex === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const deletedService = services.splice(serviceIndex, 1)[0];
    await writeServices(services);
    
    // Cancel the scheduled job for the deleted service
    scheduler.cancelServiceJob(deletedService.id);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
}

// Check service status
async function checkServiceStatus(req, res) {
  try {
    const services = await readServices();
    const service = services.find(s => s.id === parseInt(req.params.id));
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const result = await checkService(service.url, service.auth);
    service.status = result.status;
    service.lastChecked = new Date().toISOString();
    
    // Update the service in the list
    const serviceIndex = services.findIndex(s => s.id === service.id);
    services[serviceIndex] = service;
    await writeServices(services);
    
    res.json({
      id: service.id,
      status: result.status,
      lastChecked: service.lastChecked
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check service status' });
  }
}

// Check all services
async function checkAllServices(req, res) {
  try {
    const services = await readServices();
    const results = [];
    
    for (const service of services) {
      const result = await checkService(service.url, service.auth);
      service.status = result.status;
      service.lastChecked = new Date().toISOString();
      results.push({
        id: service.id,
        status: result.status,
        lastChecked: service.lastChecked
      });
    }
    
    // Update all services
    await writeServices(services);
    
    res.json({
      message: 'All services checked',
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check all services' });
  }
}

// Schedule daily check
async function scheduleDailyCheck(req, res) {
  try {
    const { time } = req.body || {};
    if (time) {
      // Parse the time (HH:MM format) and schedule accordingly
      const [hour, minute] = time.split(':').map(Number);
      if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return res.status(400).json({ error: 'Invalid time format. Use HH:MM format.' });
      }
      scheduler.scheduleDailyCheck(time);
      res.json({ message: `Daily check scheduled for ${time} every day` });
    } else {
      scheduler.scheduleDailyCheck();
      res.json({ message: 'Daily check scheduled for 9:00 AM every day' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule daily check' });
  }
}

// Cancel daily check
async function cancelDailyCheck(req, res) {
  try {
    scheduler.cancelDailyCheck();
    res.json({ message: 'Daily check cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel daily check' });
  }
}

module.exports = {
  getAllServices,
  getServiceById,
  addService,
  updateService,
  deleteService,
  checkServiceStatus,
  checkAllServices,
  scheduleDailyCheck,
  cancelDailyCheck
};
