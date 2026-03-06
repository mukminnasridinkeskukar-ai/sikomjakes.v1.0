const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sikomjakes',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

// Initialize database tables
const initDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'peserta', 'viewer') DEFAULT 'peserta',
        nama_lengkap VARCHAR(255),
        nip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Instansi table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS instansi (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama_instansi VARCHAR(255) NOT NULL,
        kode_instansi VARCHAR(50) UNIQUE,
        alamat TEXT,
        telepon VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Jabfung table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS jabfung (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama_jabfung VARCHAR(255) NOT NULL,
        jenjang ENUM('Terampil', 'Ahli Pertama', 'Ahli Muda', 'Ahli Madya', 'Ahli Utama') NOT NULL,
        kategori VARCHAR(100),
        deskripsi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Formasi table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS formasi (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_jabfung INT NOT NULL,
        id_instansi INT NOT NULL,
        jumlah_formasi INT NOT NULL,
        tahun_formasi YEAR NOT NULL,
        status ENUM('Aktif', 'Nonaktif', 'Expired') DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_jabfung) REFERENCES jabfung(id) ON DELETE CASCADE,
        FOREIGN KEY (id_instansi) REFERENCES instansi(id) ON DELETE CASCADE
      )
    `);

    // Peserta UKOM table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS peserta_ukom (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nik VARCHAR(16) UNIQUE NOT NULL,
        nama_lengkap VARCHAR(255) NOT NULL,
        tempat_lahir VARCHAR(100),
        tanggal_lahir DATE,
        jenis_kelamin ENUM('Laki-laki', 'Perempuan'),
        id_jabfung INT,
        jenjang_jabatan VARCHAR(100),
        id_instansi INT,
        unit_kerja VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        nomor_hp VARCHAR(20),
        status_verifikasi ENUM('Belum Diverifikasi', 'Lolos Administrasi', 'Tidak Lolos') DEFAULT 'Belum Diverifikasi',
        status_ujian ENUM('Belum Ujian', 'Sedang Ujian', 'Lulus', 'Tidak Lulus') DEFAULT 'Belum Ujian',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_jabfung) REFERENCES jabfung(id) ON DELETE SET NULL,
        FOREIGN KEY (id_instansi) REFERENCES instansi(id) ON DELETE SET NULL
      )
    `);

    // Dokumen Peserta table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dokumen_peserta (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_peserta INT NOT NULL,
        jenis_dokumen ENUM('SK_Jabatan', 'STR', 'Ijazah', 'Foto') NOT NULL,
        nama_file VARCHAR(255),
        path_file VARCHAR(500),
        status_validasi ENUM('Belum Valid', 'Valid', 'Invalid') DEFAULT 'Belum Valid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_peserta) REFERENCES peserta_ukom(id) ON DELETE CASCADE
      )
    `);

    // Hasil UKOM table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS hasil_ukom (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_peserta INT UNIQUE NOT NULL,
        nilai_teori DECIMAL(5,2),
        nilai_praktik DECIMAL(5,2),
        nilai_wawancara DECIMAL(5,2),
        nilai_total DECIMAL(5,2),
        status_kelulusan ENUM('LULUS', 'TIDAK LULUS', 'Belum Diisi') DEFAULT 'Belum Diisi',
        catatan_penguji TEXT,
        tanggal_ujian DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_peserta) REFERENCES peserta_ukom(id) ON DELETE CASCADE
      )
    `);

    // Audit Log table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_user INT,
        aktivitas VARCHAR(255) NOT NULL,
        tabel_terkait VARCHAR(100),
        data_lama TEXT,
        data_baru TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_user) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Insert default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password, role, nama_lengkap) 
      VALUES ('admin', 'admin@sikomjakes.go.id', ?, 'admin', 'Administrator Sistem')
    `, [hashedPassword]);

    // Insert sample data
    await connection.execute(`
      INSERT IGNORE INTO jabfung (id, nama_jabfung, jenjang, kategori) VALUES
      (1, 'Dokter Gigi', 'Ahli Pertama', 'Kesehatan'),
      (2, 'Perawat', 'Terampil', 'Kesehatan'),
      (3, 'Bidan', 'Terampil', 'Kesehatan'),
      (4, 'Apoteker', 'Ahli Pertama', 'Kesehatan'),
      (5, 'Analis Kesehatan', 'Terampil', 'Kesehatan')
    `);

    await connection.execute(`
      INSERT IGNORE INTO instansi (id, nama_instansi, kode_instansi) VALUES
      (1, 'RSUD Dr. Soetomo', 'RS001'),
      (2, 'RSUPN Dr. Cipto Mangunkusumo', 'RS002'),
      (3, 'Puskesmas Kec. Wonokromo', 'PK001'),
      (4, 'Dinas Kesehatan Provinsi Jawa Timur', 'DK001'),
      (5, 'Dinas Kesehatan Provinsi DKI Jakarta', 'DK002')
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    connection.release();
  }
};

// Run initialization
initDatabase();

module.exports = pool;
