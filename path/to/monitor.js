
function checkServiceStatus(service) {
    
    // 添加网络异常处理逻辑
    try {
        const response = await fetch(service.url, {
            method: service.method,
            headers: service.headers,
            body: service.body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // 处理返回数据
        processServiceData(data, service);
    } catch (error) {
        // 记录异常信息
        logError(service.name, error.message);
        
        // 如果是特定错误（如429 Too Many Requests），可以添加重试机制
        if (error.message.includes('429')) {
            setTimeout(() => checkServiceStatus(service), 5000); // 5秒后重试
        }
    }
}



function logError(serviceName, errorMessage) {
    console.error(`[${serviceName}] Error: ${errorMessage}`);
    // 可以将错误信息写入日志文件
    writeLog(`[${new Date().toISOString()}] [${serviceName}] Error: ${errorMessage}`);
}

