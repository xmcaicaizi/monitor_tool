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

// Check service status with optional authentication and different request methods
async function checkService(service) {
  const { url, auth = null, method = 'GET', body = null, fileConfig = null } = service;
  try {
    // Prepare axios config
    const config = { timeout: 180000 };
    
    // Add authentication if provided
    if (auth && typeof auth === 'object') {
      config.headers = config.headers || {};
      switch (auth.type) {
        case 'header':
          config.headers[auth.key] = auth.value;
          break;
        case 'query':
          // Add to URL query parameters
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}${auth.key}=${encodeURIComponent(auth.value)}`;
          break;
        case 'bearer':
          config.headers['Authorization'] = `Bearer ${auth.value}`;
          break;
      }
    }

    let response;
    const requestMethod = method ? method.toUpperCase() : 'GET';

    switch (requestMethod) {
      case 'POST':
        config.headers = config.headers || {};
        config.headers['Content-Type'] = 'application/json';
        response = await axios.post(url, body, config);
        break;
      
      case 'POST_FILE':
        const FormData = require('form-data');
        const form = new FormData();
        
        if (fileConfig && fileConfig.testFilePath) {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.resolve(fileConfig.testFilePath);
          
          try {
            if (fs.existsSync(filePath)) {
              form.append(fileConfig.fieldName || 'file', fs.createReadStream(filePath));
            } else {
              // 如果测试文件不存在，创建一个临时测试文件
              const testContent = fileConfig.testContent || 'test content';
              form.append(fileConfig.fieldName || 'file', Buffer.from(testContent), 'test.txt');
            }
          } catch (fileError) {
            console.error(`File error for service: ${fileError.message}`);
            // 使用默认测试内容
            form.append(fileConfig.fieldName || 'file', Buffer.from('test'), 'test.txt');
          }
        } else {
          // 默认测试文件
          form.append('file', Buffer.from('test'), 'test.txt');
        }
        
        config.headers = { ...config.headers, ...form.getHeaders() };
        response = await axios.post(url, form, config);
        break;
      
      default: // GET
        let requestUrl = url;
        if (auth && auth.type === 'query') {
          const separator = requestUrl.includes('?') ? '&' : '?';
          requestUrl += `${separator}${auth.key}=${encodeURIComponent(auth.value)}`;
        }
        response = await axios.get(requestUrl, config);
        break;
    }

    return {
      status: response.status >= 200 && response.status < 300 ? 'up' : 'down',
      statusCode: response.status,
      responseTime: Date.now()
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
      statusCode: error.response ? error.response.status : null
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
      method: req.body.method || 'GET',
      body: req.body.body || null,
      fileConfig: req.body.fileConfig || null,
      auth: req.body.auth || null,
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
      method: req.body.method || services[serviceIndex].method || 'GET',
      body: req.body.body !== undefined ? req.body.body : services[serviceIndex].body,
      fileConfig: req.body.fileConfig !== undefined ? req.body.fileConfig : services[serviceIndex].fileConfig,
      auth: req.body.auth !== undefined ? req.body.auth : services[serviceIndex].auth
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

// Check service status (async mode)
async function checkServiceStatus(req, res) {
  try {
    const services = await readServices();
    const service = services.find(s => s.id === parseInt(req.params.id));
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // 立即返回响应，表示检测已开始
    res.json({
      id: service.id,
      status: 'checking',
      message: 'Service check started in background',
      lastChecked: service.lastChecked
    });
    
    // 在后台异步执行检测
    setImmediate(async () => {
      try {
        const result = await checkService(service);
        service.status = result.status;
        service.lastChecked = new Date().toISOString();
        
        // 更新服务状态
        const updatedServices = await readServices();
        const serviceIndex = updatedServices.findIndex(s => s.id === service.id);
        if (serviceIndex !== -1) {
          updatedServices[serviceIndex] = {
            ...updatedServices[serviceIndex],
            status: result.status,
            lastChecked: service.lastChecked,
            statusCode: result.statusCode,
            error: result.error
          };
          await writeServices(updatedServices);
        }
        
        console.log(`Service ${service.name} (ID: ${service.id}) check completed: ${result.status}`);
      } catch (error) {
        console.error(`Error checking service ${service.name} (ID: ${service.id}):`, error.message);
        
        // 更新错误状态
        try {
          const updatedServices = await readServices();
          const serviceIndex = updatedServices.findIndex(s => s.id === service.id);
          if (serviceIndex !== -1) {
            updatedServices[serviceIndex] = {
              ...updatedServices[serviceIndex],
              status: 'down',
              lastChecked: new Date().toISOString(),
              error: error.message
            };
            await writeServices(updatedServices);
          }
        } catch (writeError) {
          console.error('Error updating service status:', writeError.message);
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to start service check' });
  }
}

// Check all services (async mode)
async function checkAllServices(req, res) {
  try {
    const services = await readServices();
    
    // 立即返回响应，表示检测已开始
    res.json({
      message: 'All services check started in background',
      status: 'checking',
      totalServices: services.length
    });
    
    // 在后台异步执行所有服务的检测
    setImmediate(async () => {
      try {
        // 先将所有服务状态设为检测中
        const updatedServices = await readServices();
        for (const service of updatedServices) {
          service.status = 'checking';
        }
        await writeServices(updatedServices);
        
        // 并行检测所有服务
        const checkPromises = services.map(async (service) => {
          try {
            const result = await checkService(service);
            return {
              id: service.id,
              status: result.status,
              statusCode: result.statusCode,
              error: result.error,
              lastChecked: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error checking service ${service.name} (ID: ${service.id}):`, error.message);
            return {
              id: service.id,
              status: 'down',
              error: error.message,
              lastChecked: new Date().toISOString()
            };
          }
        });
        
        const results = await Promise.all(checkPromises);
        
        // 更新所有服务状态
        const finalServices = await readServices();
        for (const result of results) {
          const serviceIndex = finalServices.findIndex(s => s.id === result.id);
          if (serviceIndex !== -1) {
            finalServices[serviceIndex] = {
              ...finalServices[serviceIndex],
              status: result.status,
              lastChecked: result.lastChecked,
              statusCode: result.statusCode,
              error: result.error
            };
          }
        }
        await writeServices(finalServices);
        
        console.log(`All services check completed. Results: ${results.map(r => `${r.id}:${r.status}`).join(', ')}`);
      } catch (error) {
        console.error('Error in background check all services:', error.message);
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to start all services check' });
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
