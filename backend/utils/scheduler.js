const schedule = require('node-schedule');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

const CONFIG_FILE = path.join(__dirname, '../../config/services.json');

// Store scheduled jobs
const scheduledJobs = {};

// Store daily check job
let dailyCheckJob = null;

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

// Check service status with optional authentication
async function checkService(url, auth = null) {
  try {
    // Prepare axios config
    const config = { timeout: 5000 };
    
    // Add authentication if provided
    if (auth && typeof auth === 'object') {
      switch (auth.type) {
        case 'header':
          // Add to headers
          config.headers = config.headers || {};
          config.headers[auth.key] = auth.value;
          break;
        case 'query':
          // Add to URL query parameters
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}${auth.key}=${encodeURIComponent(auth.value)}`;
          break;
        case 'bearer':
          // Add bearer token to Authorization header
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${auth.value}`;
          break;
      }
    }
    
    const response = await axios.get(url, config);
    return {
      status: response.status === 200 ? 'up' : 'down'
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}

// Update service status
async function updateServiceStatus(serviceId, status) {
  try {
    const services = await readServices();
    const serviceIndex = services.findIndex(s => s.id === serviceId);
    
    if (serviceIndex !== -1) {
      services[serviceIndex].status = status;
      services[serviceIndex].lastChecked = new Date().toISOString();
      await writeServices(services);
    }
  } catch (error) {
    console.error('Error updating service status:', error);
  }
}

// Parse interval value and unit
function parseInterval(interval) {
  // If interval is a number, treat it as seconds
  if (typeof interval === 'number') {
    return { value: interval, unit: 'second' };
  }
  
  // If interval is a string, parse it
  if (typeof interval === 'string') {
    // Try to parse combined intervals first (e.g., "1 hour 30 minutes" or "1小时30分钟")
    const combinedMatch = interval.match(/^(\d+)\s*(second|minute|hour|day|秒|分钟|小时|天)s?\s*(\d+)\s*(second|minute|hour|day|秒|分钟|小时|天)s?$/i);
    if (combinedMatch) {
      // Convert combined interval to total seconds
      const value1 = parseInt(combinedMatch[1]);
      const unit1 = mapUnitName(combinedMatch[2].toLowerCase());
      const value2 = parseInt(combinedMatch[3]);
      const unit2 = mapUnitName(combinedMatch[4].toLowerCase());
      
      // Convert to total seconds
      const totalSeconds = convertToSeconds(value1, unit1) + convertToSeconds(value2, unit2);
      return { value: totalSeconds, unit: 'second' };
    }
    
    // Try to parse simple intervals (e.g., "30 seconds" or "30分钟")
    const simpleMatch = interval.match(/^(\d+)\s*(second|minute|hour|day|秒|分钟|小时|天)s?$/i);
    if (simpleMatch) {
      const value = parseInt(simpleMatch[1]);
      const unit = mapUnitName(simpleMatch[2].toLowerCase());
      return {
        value: value,
        unit: unit
      };
    }
    
    // Default to seconds if no unit specified
    return { value: parseInt(interval) || 60, unit: 'second' };
  }
  
  // Default fallback
  return { value: 60, unit: 'second' };
}

// Helper function to map unit names (including Chinese) to standard English names
function mapUnitName(unit) {
  switch (unit) {
    case '秒':
    case 'second':
      return 'second';
    case '分钟':
    case 'minute':
      return 'minute';
    case '小时':
    case 'hour':
      return 'hour';
    case '天':
    case 'day':
      return 'day';
    default:
      return 'second'; // default fallback
  }
}

// Helper function to convert time units to seconds
function convertToSeconds(value, unit) {
  switch (unit) {
    case 'second':
      return value;
    case 'minute':
      return value * 60;
    case 'hour':
      return value * 3600;
    case 'day':
      return value * 86400;
    default:
      return value;
  }
}

// Convert interval to cron expression
function intervalToCron(intervalObj) {
  const { value, unit } = intervalObj;
  
  switch (unit) {
    case 'second':
      return `*/${value} * * * * *`;
    case 'minute':
      return `0 */${value} * * * *`;
    case 'hour':
      return `0 0 */${value} * * *`;
    case 'day':
      return `0 0 0 */${value} * *`;
    default:
      return `*/${value} * * * * *`; // default to seconds
  }
}

// Schedule a single service
function scheduleService(service) {
  // Cancel existing job if it exists
  if (scheduledJobs[service.id]) {
    scheduledJobs[service.id].cancel();
  }
  
  // Parse interval
  const intervalObj = parseInterval(service.interval);
  const cronExpression = intervalToCron(intervalObj);
  
  // Schedule new job
  const job = schedule.scheduleJob(cronExpression, async function() {
    console.log(`Checking service: ${service.name} (${service.url})`);
    const result = await checkService(service.url, service.auth);
    await updateServiceStatus(service.id, result.status);
    console.log(`Service ${service.name} is ${result.status}`);
  });
  
  // Store job reference
  scheduledJobs[service.id] = job;
  console.log(`Scheduled service: ${service.name} (every ${intervalObj.value} ${intervalObj.unit}(s))`);
}

// Reschedule a service (cancel and reschedule)
function rescheduleService(service) {
  scheduleService(service);
}

// Cancel a service job
function cancelServiceJob(serviceId) {
  if (scheduledJobs[serviceId]) {
    scheduledJobs[serviceId].cancel();
    delete scheduledJobs[serviceId];
    console.log(`Cancelled scheduled job for service ID: ${serviceId}`);
  }
}

// Schedule daily check of all services at a specific time
function scheduleDailyCheck(time) {
  // Cancel existing daily check job if it exists
  if (dailyCheckJob) {
    dailyCheckJob.cancel();
  }
  
  // Parse the time (HH:MM format) and schedule accordingly
  let hour = 9;
  let minute = 0;
  
  if (time) {
    const [h, m] = time.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      hour = h;
      minute = m;
    }
  }
  
  // Schedule daily check at the specified time every day
  dailyCheckJob = schedule.scheduleJob({ hour, minute }, async function() {
    console.log(`Running daily check of all services at ${hour}:${minute.toString().padStart(2, '0')}...`);
    try {
      const services = await readServices();
      for (const service of services) {
        console.log(`Checking service: ${service.name} (${service.url})`);
        const result = await checkService(service.url, service.auth);
        await updateServiceStatus(service.id, result.status);
        console.log(`Service ${service.name} is ${result.status}`);
      }
      console.log('Daily check completed.');
    } catch (error) {
      console.error('Error during daily check:', error);
    }
  });
  
  console.log(`Daily check scheduled for ${hour}:${minute.toString().padStart(2, '0')} every day`);
}

// Cancel daily check job
function cancelDailyCheck() {
  if (dailyCheckJob) {
    dailyCheckJob.cancel();
    dailyCheckJob = null;
    console.log('Cancelled daily check job');
  }
}

// Initialize all scheduled jobs
async function init() {
  try {
    const services = await readServices();
    services.forEach(service => {
      scheduleService(service);
    });
    console.log('All services scheduled');
    
    // Schedule daily check
    scheduleDailyCheck();
  } catch (error) {
    console.error('Error initializing scheduled jobs:', error);
  }
}

module.exports = {
  init,
  scheduleService,
  rescheduleService,
  cancelServiceJob,
  scheduleDailyCheck,
  cancelDailyCheck
};
