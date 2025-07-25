const { createApp } = Vue;

createApp({
    data() {
      return {
        services: [],
        showAddForm: false,
        showEditForm: false,
        dailyCheckTime: '09:00',
        newService: {
          name: '',
          url: '',
          intervalValue: 1,
          intervalUnit: 'minute'
        },
        editService: {
          id: null,
          name: '',
          url: '',
          intervalValue: 1,
          intervalUnit: 'minute'
        }
      };
    },
  methods: {
    async fetchServices() {
      try {
        const response = await fetch('/api/services');
        this.services = await response.json();
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    },
    
    async addService() {
      try {
        // Format interval as "value unit"
        const interval = `${this.newService.intervalValue} ${this.newService.intervalUnit}s`;
        
        const serviceData = {
          name: this.newService.name,
          url: this.newService.url,
          interval: interval
        };
        
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
          this.showAddForm = false;
          this.newService = { name: '', url: '', intervalValue: 1, intervalUnit: 'minute' };
          this.fetchServices();
        } else {
          console.error('Error adding service:', await response.text());
        }
      } catch (error) {
        console.error('Error adding service:', error);
      }
    },
    
    async deleteService(id) {
      if (!confirm('确定要删除这个服务吗？')) {
        return;
      }
      
      try {
        const response = await fetch(`/api/services/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          this.fetchServices();
        } else {
          console.error('Error deleting service:', await response.text());
        }
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    },
    
    // Method to open the edit form with service data
    openEditForm(service) {
      this.editService = {
        id: service.id,
        name: service.name,
        url: service.url,
        intervalValue: 1,
        intervalUnit: 'minute'
      };
      
      // Parse the interval string to extract value and unit
      if (typeof service.interval === 'string') {
        const match = service.interval.match(/^(\d+)\s*(second|minute|hour|day)s?$/i);
        if (match) {
          this.editService.intervalValue = parseInt(match[1]);
          this.editService.intervalUnit = match[2].toLowerCase();
        }
      } else if (typeof service.interval === 'number') {
        // If interval is a number, treat it as seconds
        this.editService.intervalValue = service.interval;
        this.editService.intervalUnit = 'second';
      }
      
      this.showEditForm = true;
    },
    
    // Method to update a service
    async updateService() {
      try {
        // Format interval as "value unit"
        const interval = `${this.editService.intervalValue} ${this.editService.intervalUnit}s`;
        
        const serviceData = {
          name: this.editService.name,
          url: this.editService.url,
          interval: interval
        };
        
        const response = await fetch(`/api/services/${this.editService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
          this.showEditForm = false;
          this.editService = { id: null, name: '', url: '', intervalValue: 1, intervalUnit: 'minute' };
          this.fetchServices();
        } else {
          console.error('Error updating service:', await response.text());
        }
      } catch (error) {
        console.error('Error updating service:', error);
      }
    },
    
    async checkService(id) {
      try {
        const response = await fetch(`/api/services/${id}/check`, {
          method: 'POST'
        });
        
        if (response.ok) {
          this.fetchServices();
        } else {
          console.error('Error checking service:', await response.text());
        }
      } catch (error) {
        console.error('Error checking service:', error);
      }
    },
    
    async checkAllServices() {
      try {
        const response = await fetch('/api/services/check-all', {
          method: 'POST'
        });
        
        if (response.ok) {
          this.fetchServices();
        } else {
          console.error('Error checking all services:', await response.text());
        }
      } catch (error) {
        console.error('Error checking all services:', error);
      }
    },
    
    async scheduleDailyCheck() {
      try {
        const response = await fetch('/api/services/schedule-daily-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ time: this.dailyCheckTime })
        });
        
        if (response.ok) {
          alert(`每日检查已设置为每天${this.dailyCheckTime}执行`);
        } else {
          console.error('Error scheduling daily check:', await response.text());
          alert('设置每日检查失败');
        }
      } catch (error) {
        console.error('Error scheduling daily check:', error);
        alert('设置每日检查失败');
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'up':
          return '正常';
        case 'down':
          return '异常';
        default:
          return '未知';
      }
    },
    
    formatDateTime(isoString) {
      if (!isoString) return '未检测';
      
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    formatInterval(interval) {
      // If interval is a number, treat it as seconds
      if (typeof interval === 'number') {
        return this.formatSeconds(interval);
      }
      
      // If interval is a string, parse it
      if (typeof interval === 'string') {
        // Try to parse combined intervals first (e.g., "1 hour 30 minutes")
        const combinedMatch = interval.match(/^(\d+)\s*(second|minute|hour|day)s?\s*(\d+)\s*(second|minute|hour|day)s?$/i);
        if (combinedMatch) {
          // Convert combined interval to total seconds
          const value1 = parseInt(combinedMatch[1]);
          const unit1 = combinedMatch[2].toLowerCase();
          const value2 = parseInt(combinedMatch[3]);
          const unit2 = combinedMatch[4].toLowerCase();
          
          // Convert to total seconds
          const totalSeconds = this.convertToSeconds(value1, unit1) + this.convertToSeconds(value2, unit2);
          return this.formatSeconds(totalSeconds);
        }
        
        // Try to parse simple intervals (e.g., "30 seconds")
        const simpleMatch = interval.match(/^(\d+)\s*(second|minute|hour|day)s?$/i);
        if (simpleMatch) {
          const value = simpleMatch[1];
          const unit = simpleMatch[2].toLowerCase();
          
          switch (unit) {
            case 'second':
              return `${value} 秒`;
            case 'minute':
              return `${value} 分钟`;
            case 'hour':
              return `${value} 小时`;
            case 'day':
              return `${value} 天`;
            default:
              return interval;
          }
        }
      }
      
      // Default fallback
      return '未知';
    },
    
    // Helper function to convert time units to seconds
    convertToSeconds(value, unit) {
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
    },
    
    // Helper function to format seconds into a human-readable format
    formatSeconds(totalSeconds) {
      if (totalSeconds < 60) {
        return `${totalSeconds} 秒`;
      }
      
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      let result = '';
      if (days > 0) result += `${days} 天 `;
      if (hours > 0) result += `${hours} 小时 `;
      if (minutes > 0) result += `${minutes} 分钟 `;
      if (seconds > 0) result += `${seconds} 秒`;
      
      return result.trim();
    }
  },
  
  mounted() {
    this.fetchServices();
    
    // Refresh services every 10 seconds
    setInterval(() => {
      this.fetchServices();
    }, 10000);
  }
}).mount('#app');
