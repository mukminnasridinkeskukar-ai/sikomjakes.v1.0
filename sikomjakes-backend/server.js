require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Configuration
const db = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const jabfungRoutes = require('./routes/jabfung');
const formasiRoutes = require('./routes/formasi');
const pesertaRoutes = require('./routes/peserta');
const adminRoutes = require('./routes/admin');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jabfung', jabfungRoutes);
app.use('/api/formasi', formasiRoutes);
app.use('/api/peserta', pesertaRoutes);
app.use('/api/admin', adminRoutes);

// Database Backup Schedule (Daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily database backup...');
  // Backup logic would go here
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../sikomjakes-frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../sikomjakes-frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`SIKOMJAKES Server running on port ${PORT}`);
});

module.exports = app;
