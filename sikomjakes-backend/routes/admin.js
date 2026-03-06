const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, adminOnly, auditLog } = require('../middleware/audit');

// Get all users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    
    let query = 'SELECT id, username, email, role, nama_lengkap, nip, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR nama_lengkap LIKE ?)';
      countQuery += ' AND (username LIKE ? OR email LIKE ? OR nama_lengkap LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';
    
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
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create user (admin only)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, email, password, role, nama_lengkap, nip } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role, nama_lengkap, nip) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, nama_lengkap, nip]
    );

    await auditLog(req.user.id, 'CREATE', 'users', null, JSON.stringify({ username, email, role }), req.ip);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const [old] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { username, email, role, nama_lengkap, nip } = req.body;

    await db.execute(
      'UPDATE users SET username = ?, email = ?, role = ?, nama_lengkap = ?, nip = ? WHERE id = ?',
      [username, email, role, nama_lengkap, nip, req.params.id]
    );

    await auditLog(req.user.id, 'UPDATE', 'users', JSON.stringify(old[0]), JSON.stringify(req.body), req.ip);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const [old] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

    await auditLog(req.user.id, 'DELETE', 'users', JSON.stringify(old[0]), null, req.ip);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify peserta
router.put('/peserta/:id/verify', auth, adminOnly, async (req, res) => {
  try {
    const { status_verifikasi, catatan } = req.body;
    
    const [old] = await db.execute('SELECT * FROM peserta_ukom WHERE id = ?', [req.params.id]);
    
    if (old.length === 0) {
      return res.status(404).json({ success: false, message: 'Peserta not found' });
    }

    await db.execute(
      'UPDATE peserta_ukom SET status_verifikasi = ? WHERE id = ?',
      [status_verifikasi, req.params.id]
    );

    await auditLog(req.user.id, 'VERIFY_PESERTA', 'peserta_ukom', 
      JSON.stringify(old[0]), 
      JSON.stringify({ status_verifikasi, catatan }), 
      req.ip
    );

    res.json({ success: true, message: 'Verifikasi berhasil diperbarui' });
  } catch (error) {
    console.error('Verify peserta error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Validate dokumen
router.put('/peserta/:id/dokumen/:dokumenId/validate', auth, adminOnly, async (req, res) => {
  try {
    const { status_validasi } = req.body;
    
    await db.execute(
      'UPDATE dokumen_peserta SET status_validasi = ? WHERE id = ?',
      [status_validasi, req.params.dokumenId]
    );

    await auditLog(req.user.id, 'VALIDATE_DOKUMEN', 'dokumen_peserta', null, 
      JSON.stringify({ dokumenId: req.params.dokumenId, status_validasi }), req.ip);

    res.json({ success: true, message: 'Validasi dokumen berhasil' });
  } catch (error) {
    console.error('Validate dokumen error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Input hasil UKOM
router.put('/peserta/:id/hasil', auth, adminOnly, async (req, res) => {
  try {
    const { nilai_teori, nilai_praktik, nilai_wawancara, status_kelulusan, catatan_penguji, tanggal_ujian } = req.body;
    
    const nilai_total = (parseFloat(nilai_teori) + parseFloat(nilai_praktik) + parseFloat(nilai_wawancara)) / 3;

    // Check if result exists
    const [existing] = await db.execute('SELECT * FROM hasil_ukom WHERE id_peserta = ?', [req.params.id]);

    if (existing.length > 0) {
      await db.execute(
        `UPDATE hasil_ukom SET nilai_teori = ?, nilai_praktik = ?, nilai_wawancara = ?, 
         nilai_total = ?, status_kelulusan = ?, catatan_penguji = ?, tanggal_ujian = ? 
         WHERE id_peserta = ?`,
        [nilai_teori, nilai_praktik, nilai_wawancara, nilai_total, status_kelulusan, catatan_penguji, tanggal_ujian, req.params.id]
      );
    } else {
      await db.execute(
        `INSERT INTO hasil_ukom (id_peserta, nilai_teori, nilai_praktik, nilai_wawancara, nilai_total, status_kelulusan, catatan_penguji, tanggal_ujian) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, nilai_teori, nilai_praktik, nilai_wawancara, nilai_total, status_kelulusan, catatan_penguji, tanggal_ujian]
      );
    }

    // Update peserta status
    const statusUjian = status_kelulusan === 'LULUS' ? 'Lulus' : 'Tidak Lulus';
    await db.execute(
      'UPDATE peserta_ukom SET status_ujian = ? WHERE id = ?',
      [statusUjian, req.params.id]
    );

    await auditLog(req.user.id, 'INPUT_HASIL', 'hasil_ukom', null, 
      JSON.stringify({ id_peserta: req.params.id, nilai_total, status_kelulusan }), req.ip);

    res.json({ success: true, message: 'Hasil UKOM berhasil disimpan' });
  } catch (error) {
    console.error('Input hasil error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all instances
router.get('/instansi', auth, adminOnly, async (req, res) => {
  try {
    const [data] = await db.execute('SELECT * FROM instansi ORDER BY nama_instansi ASC');
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Get instansi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create instance (admin only)
router.post('/instansi', auth, adminOnly, async (req, res) => {
  try {
    const { nama_instansi, kode_instansi, alamat, telepon, email } = req.body;

    const [result] = await db.execute(
      'INSERT INTO instansi (nama_instansi, kode_instansi, alamat, telepon, email) VALUES (?, ?, ?, ?, ?)',
      [nama_instansi, kode_instansi, alamat, telepon, email]
    );

    await auditLog(req.user.id, 'CREATE', 'instansi', null, JSON.stringify(req.body), req.ip);

    res.status(201).json({
      success: true,
      message: 'Instansi created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create instansi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get audit logs
router.get('/audit-logs', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const [data] = await db.execute(`
      SELECT al.*, u.username, u.nama_lengkap 
      FROM audit_log al
      LEFT JOIN users u ON al.id_user = u.id
      ORDER BY al.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${(page - 1) * parseInt(limit)}
    `);

    const [count] = await db.execute('SELECT COUNT(*) as total FROM audit_log');

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
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
