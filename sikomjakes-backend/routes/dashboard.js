const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total Peserta UKOM
    const [totalPeserta] = await db.execute('SELECT COUNT(*) as count FROM peserta_ukom');
    
    // Total Jabfung Terdaftar
    const [totalJabfung] = await db.execute('SELECT COUNT(*) as count FROM jabfung');
    
    // Total Formasi Nasional
    const [totalFormasi] = await db.execute('SELECT SUM(jumlah_formasi) as count FROM formasi WHERE status = "Aktif"');
    
    // Peserta Lulus
    const [pesertaLulus] = await db.execute(
      "SELECT COUNT(*) as count FROM peserta_ukom WHERE status_ujian = 'Lulus'"
    );
    
    // Peserta Tidak Lulus
    const [pesertaTidakLulus] = await db.execute(
      "SELECT COUNT(*) as count FROM peserta_ukom WHERE status_ujian = 'Tidak Lulus'"
    );

    res.json({
      success: true,
      data: {
        totalPeserta: totalPeserta[0].count || 0,
        totalJabfung: totalJabfung[0].count || 0,
        totalFormasi: totalFormasi[0].count || 0,
        pesertaLulus: pesertaLulus[0].count || 0,
        pesertaTidakLulus: pesertaTidakLulus[0].count || 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get chart data - Peserta per Tahun
router.get('/chart/tahun', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT YEAR(created_at) as tahun, COUNT(*) as jumlah
      FROM peserta_ukom
      GROUP BY YEAR(created_at)
      ORDER BY tahun DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: data.reverse()
    });
  } catch (error) {
    console.error('Chart tahun error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get chart data - Peserta per Jenis Jabfung
router.get('/chart/jabfung', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT j.nama_jabfung as nama, COUNT(p.id) as jumlah
      FROM jabfung j
      LEFT JOIN peserta_ukom p ON j.id = p.id_jabfung
      GROUP BY j.id, j.nama_jabfung
      ORDER BY jumlah DESC
    `);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Chart jabfung error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get chart data - Kelulusan
router.get('/chart/kelulusan', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status_ujian = 'Lulus' THEN 1 ELSE 0 END) as lulus,
        SUM(CASE WHEN status_ujian = 'Tidak Lulus' THEN 1 ELSE 0 END) as tidak_lulus,
        SUM(CASE WHEN status_ujian = 'Belum Ujian' THEN 1 ELSE 0 END) as belum_ujian
      FROM peserta_ukom
    `);

    res.json({
      success: true,
      data: [{
        label: 'Lulus',
        value: data[0].lulus || 0
      }, {
        label: 'Tidak Lulus',
        value: data[0].tidak_lulus || 0
      }, {
        label: 'Belum Ujian',
        value: data[0].belum_ujian || 0
      }]
    });
  } catch (error) {
    console.error('Chart kelulusan error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get chart data - Peserta per Provinsi (based on email domain or random for demo)
router.get('/chart/provinsi', async (req, res) => {
  try {
    const [data] = await db.execute(`
      SELECT 
        CASE 
          WHEN email LIKE '%@jakarta%' THEN 'DKI Jakarta'
          WHEN email LIKE '%@surabaya%' THEN 'Jawa Timur'
          WHEN email LIKE '%@bandung%' THEN 'Jawa Barat'
          WHEN email LIKE '%@semarang%' THEN 'Jawa Tengah'
          ELSE 'Lainnya'
        END as provinsi,
        COUNT(*) as jumlah
      FROM peserta_ukom
      GROUP BY provinsi
    `);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Chart provinsi error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get recent activities
router.get('/recent-activities', async (req, res) => {
  try {
    const [activities] = await db.execute(`
      SELECT al.*, u.nama_lengkap 
      FROM audit_log al
      LEFT JOIN users u ON al.id_user = u.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
