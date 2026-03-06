const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, adminOnly, auditLog } = require('../middleware/audit');

// Get all formasi with join
router.get('/', async (req, res) => {
  try {
    const { search, tahun, status, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT f.*, j.nama_jabfung, j.jenjang as jenjang_jabfung, i.nama_instansi, i.kode_instansi
      FROM formasi f
      LEFT JOIN jabfung j ON f.id_jabfung = j.id
      LEFT JOIN instansi i ON f.id_instansi = i.id
      WHERE 1=1
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM formasi f WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (j.nama_jabfung LIKE ? OR i.nama_instansi LIKE ?)';
      countQuery += ' AND (j.nama_jabfung LIKE ? OR i.nama_instansi LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tahun) {
      query += ' AND f.tahun_formasi = ?';
      countQuery += ' AND f.tahun_formasi = ?';
      params.push(tahun);
    }

    if (status) {
      query += ' AND f.status = ?';
      countQuery += ' AND f.status = ?';
      params.push(status);
    }

    query += ' ORDER BY f.created_at DESC';
    
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
    console.error('Get formasi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single formasi
router.get('/:id', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT f.*, j.nama_jabfung, j.jenjang as jenjang_jabfung, i.nama_instansi, i.kode_instansi
      FROM formasi f
      LEFT JOIN jabfung j ON f.id_jabfung = j.id
      LEFT JOIN instansi i ON f.id_instansi = i.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'Formasi not found' });
    }

    res.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Get formasi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create formasi (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { id_jabfung, id_instansi, jumlah_formasi, tahun_formasi, status } = req.body;

    const [result] = await db.execute(
      'INSERT INTO formasi (id_jabfung, id_instansi, jumlah_formasi, tahun_formasi, status) VALUES (?, ?, ?, ?, ?)',
      [id_jabfung, id_instansi, jumlah_formasi, tahun_formasi, status || 'Aktif']
    );

    await auditLog(req.user.id, 'CREATE', 'formasi', null, JSON.stringify(req.body), req.ip);

    res.status(201).json({
      success: true,
      message: 'Formasi created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create formasi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update formasi (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const [old] = await db.execute('SELECT * FROM formasi WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'Formasi not found' });
    }

    const { id_jabfung, id_instansi, jumlah_formasi, tahun_formasi, status } = req.body;

    await db.execute(
      'UPDATE formasi SET id_jabfung = ?, id_instansi = ?, jumlah_formasi = ?, tahun_formasi = ?, status = ? WHERE id = ?',
      [id_jabfung, id_instansi, jumlah_formasi, tahun_formasi, status, req.params.id]
    );

    await auditLog(req.user.id, 'UPDATE', 'formasi', JSON.stringify(old[0]), JSON.stringify(req.body), req.ip);

    res.json({ success: true, message: 'Formasi updated successfully' });
  } catch (error) {
    console.error('Update formasi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete formasi (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const [old] = await db.execute('SELECT * FROM formasi WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'Formasi not found' });
    }

    await db.execute('DELETE FROM formasi WHERE id = ?', [req.params.id]);

    await auditLog(req.user.id, 'DELETE', 'formasi', JSON.stringify(old[0]), null, req.ip);

    res.json({ success: true, message: 'Formasi deleted successfully' });
  } catch (error) {
    console.error('Delete formasi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get formasi statistics (for bazzetting)
router.get('/stats/bazzetting', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT 
        i.nama_instansi,
        i.kode_instansi,
        j.nama_jabfung,
        j.jenjang,
        f.jumlah_formasi as kebutuhan_ideal,
        (SELECT COUNT(*) FROM peserta_ukom p WHERE p.id_instansi = f.id_instansi AND p.id_jabfung = f.id_jabfung) as sdm_tersedia,
        (f.jumlah_formasi - (SELECT COUNT(*) FROM peserta_ukom p WHERE p.id_instansi = f.id_instansi AND p.id_jabfung = f.id_jabfung)) as selisih,
        CASE 
          WHEN f.jumlah_formasi <= (SELECT COUNT(*) FROM peserta_ukom p WHERE p.id_instansi = f.id_instansi AND p.id_jabfung = f.id_jabfung) 
          THEN 'Terpenuhi'
          ELSE 'Kekurangan'
        END as status_kebutuhan
      FROM formasi f
      LEFT JOIN jabfung j ON f.id_jabfung = j.id
      LEFT JOIN instansi i ON f.id_instansi = i.id
      WHERE f.status = 'Aktif'
    `);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get bazzetting error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
