const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { auth, auditLog } = require('../middleware/audit');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all peserta
router.get('/', async (req, res) => {
  try {
    const { search, id_jabfung, id_instansi, status_verifikasi, status_ujian, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT p.*, j.nama_jabfung, i.nama_instansi,
      (SELECT path_file FROM dokumen_peserta dp WHERE dp.id_peserta = p.id AND dp.jenis_dokumen = 'Foto' LIMIT 1) as foto
      FROM peserta_ukom p
      LEFT JOIN jabfung j ON p.id_jabfung = j.id
      LEFT JOIN instansi i ON p.id_instansi = i.id
      WHERE 1=1
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM peserta_ukom p WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (p.nik LIKE ? OR p.nama_lengkap LIKE ? OR p.email LIKE ?)';
      countQuery += ' AND (p.nik LIKE ? OR p.nama_lengkap LIKE ? OR p.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (id_jabfung) {
      query += ' AND p.id_jabfung = ?';
      countQuery += ' AND p.id_jabfung = ?';
      params.push(id_jabfung);
    }

    if (id_instansi) {
      query += ' AND p.id_instansi = ?';
      countQuery += ' AND p.id_instansi = ?';
      params.push(id_instansi);
    }

    if (status_verifikasi) {
      query += ' AND p.status_verifikasi = ?';
      countQuery += ' AND p.status_verifikasi = ?';
      params.push(status_verifikasi);
    }

    if (status_ujian) {
      query += ' AND p.status_ujian = ?';
      countQuery += ' AND p.status_ujian = ?';
      params.push(status_ujian);
    }

    query += ' ORDER BY p.created_at DESC';
    
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
    console.error('Get peserta error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check NIK exists
router.get('/check-nik/:nik', async (req, res) => {
  try {
    const [data] = await db.execute('SELECT id, nama_lengkap FROM peserta_ukom WHERE nik = ?', [req.params.nik]);

    if (data.length > 0) {
      return res.json({
        success: true,
        exists: true,
        message: 'NIK sudah terdaftar dalam sistem',
        data: data[0]
      });
    }

    res.json({ success: true, exists: false });
  } catch (error) {
    console.error('Check NIK error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single peserta
router.get('/:id', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT p.*, j.nama_jabfung, i.nama_instansi,
      (SELECT path_file FROM dokumen_peserta dp WHERE dp.id_peserta = p.id AND dp.jenis_dokumen = 'Foto' LIMIT 1) as foto
      FROM peserta_ukom p
      LEFT JOIN jabfung j ON p.id_jabfung = j.id
      LEFT JOIN instansi i ON p.id_instansi = i.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'Peserta not found' });
    }

    // Get documents
    const [documents] = await db.execute(
      'SELECT * FROM dokumen_peserta WHERE id_peserta = ?',
      [req.params.id]
    );

    // Get exam results
    const [results] = await db.execute(
      'SELECT * FROM hasil_ukom WHERE id_peserta = ?',
      [req.params.id]
    );

    res.json({ 
      success: true, 
      data: data[0],
      documents: documents,
      results: results[0] || null
    });
  } catch (error) {
    console.error('Get peserta error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create peserta (registration)
router.post('/', async (req, res) => {
  try {
    const { 
      nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin,
      id_jabfung, jenjang_jabatan, id_instansi, unit_kerja, email, nomor_hp
    } = req.body;

    // Check if NIK exists
    const [existing] = await db.execute('SELECT id FROM peserta_ukom WHERE nik = ?', [nik]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'NIK sudah terdaftar dalam sistem',
        code: 'NIK_EXISTS'
      });
    }

    // Check if email exists
    const [existingEmail] = await db.execute('SELECT id FROM peserta_ukom WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah terdaftar dalam sistem' 
      });
    }

    const [result] = await db.execute(
      `INSERT INTO peserta_ukom (nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, id_jabfung, jenjang_jabatan, id_instansi, unit_kerja, email, nomor_hp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nik, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, id_jabfung, jenjang_jabatan, id_instansi, unit_kerja, email, nomor_hp]
    );

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create peserta error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload dokumen
router.post('/:id/dokumen', upload.single('file'), async (req, res) => {
  try {
    const { jenis_dokumen } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    const [result] = await db.execute(
      `INSERT INTO dokumen_peserta (id_peserta, jenis_dokumen, nama_file, path_file) VALUES (?, ?, ?, ?)`,
      [req.params.id, jenis_dokumen, req.file.originalname, req.file.path]
    );

    res.status(201).json({
      success: true,
      message: 'Dokumen berhasil diupload',
      id: result.insertId,
      file: {
        name: req.file.originalname,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Upload dokumen error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get dokumen
router.get('/:id/dokumen', async (req, res) => {
  try {
    const [data] = await db.execute(
      'SELECT * FROM dokumen_peserta WHERE id_peserta = ?',
      [req.params.id]
    );

    res.json({ success: true, data: data });
  } catch (error) {
    console.error('Get dokumen error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
