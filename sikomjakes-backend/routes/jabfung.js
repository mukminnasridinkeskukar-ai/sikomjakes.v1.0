const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, adminOnly, auditLog } = require('../middleware/audit');

// Get all jabfung
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM jabfung';
    let countQuery = 'SELECT COUNT(*) as total FROM jabfung';
    let params = [];

    if (search) {
      query += ' WHERE nama_jabfung LIKE ?';
      countQuery += ' WHERE nama_jabfung LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY nama_jabfung ASC';
    
    const offset = (page - 1) * limit;
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [data] = await db.execute(query, params);
    const [count] = await db.execute(countQuery, params);

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].total,
        totalPages: Math.ceil(count[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get jabfung error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single jabfung
router.get('/:id', async (req, res) => {
  try {
    const [data] = await db.execute('SELECT * FROM jabfung WHERE id = ?', [req.params.id]);

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'Jabfung not found' });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Get jabfung error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create jabfung (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { nama_jabfung, jenjang, kategori, deskripsi } = req.body;

    const [result] = await db.execute(
      'INSERT INTO jabfung (nama_jabfung, jenjang, kategori, deskripsi) VALUES (?, ?, ?, ?)',
      [nama_jabfung, jenjang, kategori, deskripsi]
    );

    await auditLog(req.user.id, 'CREATE', 'jabfung', null, JSON.stringify(req.body), req.ip);

    res.status(201).json({
      success: true,
      message: 'Jabfung created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create jabfung error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update jabfung (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const [old] = await db.execute('SELECT * FROM jabfung WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'Jabfung not found' });
    }

    const { nama_jabfung, jenjang, kategori, deskripsi } = req.body;

    await db.execute(
      'UPDATE jabfung SET nama_jabfung = ?, jenjang = ?, kategori = ?, deskripsi = ? WHERE id = ?',
      [nama_jabfung, jenjang, kategori, deskripsi, req.params.id]
    );

    await auditLog(req.user.id, 'UPDATE', 'jabfung', JSON.stringify(old[0]), JSON.stringify(req.body), req.ip);

    res.json({ success: true, message: 'Jabfung updated successfully' });
  } catch (error) {
    console.error('Update jabfung error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete jabfung (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const [old] = await db.execute('SELECT * FROM jabfung WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'Jabfung not found' });
    }

    await db.execute('DELETE FROM jabfung WHERE id = ?', [req.params.id]);

    await auditLog(req.user.id, 'DELETE', 'jabfung', JSON.stringify(old[0]), null, req.ip);

    res.json({ success: true, message: 'Jabfung deleted successfully' });
  } catch (error) {
    console.error('Delete jabfung error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
