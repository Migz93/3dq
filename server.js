const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const fs = require('fs');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize database
const dbPath = path.join(__dirname, 'database', '3dq.sqlite');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// Import routes
const filamentRoutes = require('./routes/filaments');
const printerRoutes = require('./routes/printers');
const hardwareRoutes = require('./routes/hardware');
const quoteRoutes = require('./routes/quotes');
const settingsRoutes = require('./routes/settings');

// Use routes
app.use('/api/filaments', filamentRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
