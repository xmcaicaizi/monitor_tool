const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files
const frontendPath = path.join(__dirname, 'frontend');
console.log('Serving static files from:', frontendPath);
app.use(express.static(frontendPath));

// Routes
app.use('/api/services', require('./backend/routes/services'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Initialize scheduled jobs
  require('./backend/utils/scheduler').init();
});
