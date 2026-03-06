const db = require('../config/database');

// Audit log function
const auditLog = async (userId, activity, table, oldData, newData, ipAddress) => {
  try {
    await db.execute(
      `INSERT INTO audit_log (id_user, aktivitas, tabel_terkait, data_lama, data_baru, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, activity, table, oldData, newData, ipAddress]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sikomjakes_secret_key_2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Admin middleware
const adminOnly = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

module.exports = { auditLog, auth, adminOnly };
