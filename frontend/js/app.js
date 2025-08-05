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
          method: 'GET',
          body: '',
          fileFieldName: 'file',
          testFilePath: '',
          intervalValue: 1,
          intervalUnit: 'minute',
          authType: '',
          authKey: '',
          authValue: ''
        },
        editService: {
          id: null,
          name: '',
          url: '',
          method: 'GET',
          body: '',
          fileFieldName: 'file',
          testFilePath: '',
          intervalValue: 1,
          intervalUnit: 'minute',
          authType: '',
          authKey: '',
          authValue: ''
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
        
        // Prepare service data
        const serviceData = {
          name: this.newService.name,
          url: this.newService.url,
          method: this.newService.method,
          interval: interval
        };

        // Add request body for POST requests
        if (this.newService.method === 'POST' && this.newService.body) {
          try {
            serviceData.body = JSON.parse(this.newService.body);
          } catch (e) {
            alert('请输入有效的JSON格式');
            return;
          }
        }

        // Add file config for file upload requests
        if (this.newService.method === 'POST_FILE') {
          serviceData.fileConfig = {
            fieldName: this.newService.fileFieldName || 'file',
            testFilePath: this.newService.testFilePath || null
          };
        }
        
        // Add auth data if provided
        if (this.newService.authType) {
          serviceData.auth = {
            type: this.newService.authType,
            key: this.newService.authType === 'bearer' ? 'Authorization' : this.newService.authKey,
            value: this.newService.authValue
          };
        }
        
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
          this.showAddForm = false;
          this.newService = { 
            name: '', 
            url: '', 
            method: 'GET',
            body: '',
            fileFieldName: 'file',
            testFilePath: '',
            intervalValue: 1, 
            intervalUnit: 'minute',
            authType: '',
            authKey: '',
            authValue: ''
          };
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
        method: service.method || 'GET',
        body: '',
        fileFieldName: 'file',
        testFilePath: '',
        intervalValue: 1,
        intervalUnit: 'minute',
        authType: '',
        authKey: '',
        authValue: ''
      };
      
      // Handle request body for POST requests
      if (service.body && typeof service.body === 'object') {
        this.editService.body = JSON.stringify(service.body, null, 2);
      }

      // Handle file config for file upload requests
      if (service.fileConfig && typeof service.fileConfig === 'object') {
        this.editService.fileFieldName = service.fileConfig.fieldName || 'file';
        this.editService.testFilePath = service.fileConfig.testFilePath || '';
      }
      
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
      
      // Handle auth data if present
      if (service.auth && typeof service.auth === 'object') {
        this.editService.authType = service.auth.type || '';
        this.editService.authKey = service.auth.type === 'bearer' ? '' : (service.auth.key || '');
        this.editService.authValue = service.auth.value || '';
      }
      
      this.showEditForm = true;
    },
    
    // Method to update a service
    async updateService() {
      try {
        // Format interval as "value unit"
        const interval = `${this.editService.intervalValue} ${this.editService.intervalUnit}s`;
        
        // Prepare service data
        const serviceData = {
          name: this.editService.name,
          url: this.editService.url,
          method: this.editService.method,
          interval: interval
        };

        // Add request body for POST requests
        if (this.editService.method === 'POST' && this.editService.body) {
          try {
            serviceData.body = JSON.parse(this.editService.body);
          } catch (e) {
            alert('请输入有效的JSON格式');
            return;
          }
        } else if (this.editService.method !== 'POST') {
          serviceData.body = null;
        }

        // Add file config for file upload requests
        if (this.editService.method === 'POST_FILE') {
          serviceData.fileConfig = {
            fieldName: this.editService.fileFieldName || 'file',
            testFilePath: this.editService.testFilePath || null
          };
        } else {
          serviceData.fileConfig = null;
        }
        
        // Add auth data if provided
        if (this.editService.authType) {
          serviceData.auth = {
            type: this.editService.authType,
            key: this.editService.authType === 'bearer' ? 'Authorization' : this.editService.authKey,
            value: this.editService.authValue
          };
        } else {
          serviceData.auth = null;
        }
        
        const response = await fetch(`/api/services/${this.editService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(serviceData)
        });
        
        if (response.ok) {
          this.showEditForm = false;
          this.editService = { 
            id: null, 
            name: '', 
            url: '', 
            method: 'GET',
            body: '',
            fileFieldName: 'file',
            testFilePath: '',
            intervalValue: 1, 
            intervalUnit: 'minute',
            authType: '',
            authKey: '',
            authValue: ''
          };
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
        // 先将服务状态设置为检测中
        const serviceIndex = this.services.findIndex(s => s.id === id);
        if (serviceIndex !== -1) {
          this.services[serviceIndex].status = 'checking';
        }
        
        const response = await fetch(`/api/services/${id}/check`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Service check started:', result.message);
          
          // 每2秒刷新一次服务状态，直到检测完成
          const checkInterval = setInterval(() => {
            this.fetchServices().then(() => {
              const service = this.services.find(s => s.id === id);
              if (service && service.status !== 'checking') {
                clearInterval(checkInterval);
              }
            });
          }, 2000);
          
          // 10分钟后停止轮询（防止无限轮询）
          setTimeout(() => {
            clearInterval(checkInterval);
          }, 600000);
          
        } else {
          console.error('Error checking service:', await response.text());
          // 恢复原状态
          this.fetchServices();
        }
      } catch (error) {
        console.error('Error checking service:', error);
        // 恢复原状态
        this.fetchServices();
      }
    },
    
    async checkAllServices() {
      try {
        const response = await fetch('/api/services/check-all', {
          method: 'POST'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('All services check started:', result.message);
          
          // 立即刷新一次以显示"检测中"状态
          this.fetchServices();
          
          // 开始轮询检测状态
          const checkInterval = setInterval(async () => {
            await this.fetchServices();
            
            // 检查是否还有服务在检测中
            const hasCheckingServices = this.services.some(service => service.status === 'checking');
            
            if (!hasCheckingServices) {
              // 所有服务检测完成，停止轮询
              clearInterval(checkInterval);
              console.log('All services check completed');
            }
          }, 2000); // 每2秒检查一次
          
          // 10分钟后强制停止轮询（防止无限轮询）
          setTimeout(() => {
            clearInterval(checkInterval);
            console.log('All services check polling timeout');
          }, 600000);
          
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
        case 'checking':
          return '检测中';
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
    },
    
    // Helper method to get label for auth key input based on auth type
    getAuthKeyLabel(authType) {
      switch (authType) {
        case 'header':
          return 'Header名称';
        case 'query':
          return '参数名称';
        default:
          return 'Key';
      }
    },
    
    // Helper method to get placeholder for auth key input based on auth type
    getAuthKeyPlaceholder(authType) {
      switch (authType) {
        case 'header':
          return '例如: X-API-Key';
        case 'query':
          return '例如: api_key';
        default:
          return '';
      }
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
