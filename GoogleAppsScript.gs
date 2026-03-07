// ============================================
// SIKOMJAKES - Google Apps Script
// ============================================
// Google Sheet ID: 1Ox0u5WMWcpqk5u1rHvQ5x1doZn9787FZGf_zGRDVUOo
// Drive Folder ID: 1GenTbOhj92qA-DAVHZTXRYqIxq65CVDF
// Sheets: Peserta, Formasi, Bazzetting
// ============================================

const SPREADSHEET_ID = '1Ox0u5WMWcpqk5u1rHvQ5x1doZn9787FZGf_zGRDVUOo';
const DRIVE_FOLDER_ID = '1GenTbOhj92qA-DAVHZTXRYqIxq65CVDF';

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index').setTitle('SIKOMJAKES');
}

function doPost(e) {
  try {
    const parameter = e.parameter;
    const action = parameter.action;
    
    if (action === 'save') {
      const data = JSON.parse(parameter.data);
      return saveToSpreadsheet(data);
    } 
    else if (action === 'upload') {
      return uploadToDrive(parameter);
    }
    else if (action === 'getData') {
      const sheetName = parameter.sheet || 'Peserta';
      return getDataFromSheet(sheetName);
    }
    else if (action === 'getDashboard') {
      return getDashboardStats();
    }
    else if (action === 'updateStatus') {
      const data = JSON.parse(parameter.data);
      return updateParticipantStatus(data);
    }
    else if (action === 'deleteData') {
      const data = JSON.parse(parameter.data);
      return deleteParticipant(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid action: ' + action }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message, stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Save participant data to "Peserta" sheet
function saveToSpreadsheet(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Peserta');
    
    // Create "Peserta" sheet if not exists
    if (!sheet) {
      sheet = ss.insertSheet('Peserta');
      // Add headers matching user's structure
      const headers = [
        'Timestamp', 'Periode', 'Nama Lengkap', 'NIK', 'NIP', 
        'Nomor Telpon/WA', 'Email Aktif', 'Unit Kerja', 'Jenis Jabatan', 
        'Jenjang Jabatan', 'Pangkat dan Golongan', 'Nilai PAK terakhir', 
        'Nomor STR', 'Kategori Penjenjangan Jabatan', 
        'Nama Jabatan Fungsional Yang Dituju', 'Jenjang Jabatan Tujuan',
        'Upload Foto Latar Merah', 'Upload Kelengkapan Dokumen',
        'Status Verifikasi', 'Status Ujian', 'Keputusan Tim Pengelola UKOM', 'ID FOTO DRIVE'
      ];
      sheet.appendRow(headers);
    }
    
    const row = [
      data.timestamp || new Date().toISOString(),
      data.periode || '',
      data.nama_lengkap || '',
      data.nik || '',
      data.nip || '',
      data.nomor_telpon || '',
      data.email || '',
      data.unit_kerja || '',
      data.jenis_jabatan || '',
      data.jenjang_jabatan || '',
      data.pangkat_gol || '',
      data.nilai_pak || '',
      data.nomor_str || '',
      data.kategori_penjenjangan || '',
      data.jabfung_tujuan || '',
      data.jenjang_tujuan || '',
      data.foto_url || '',
      data.dokumen_url || '',
      'Belum Diverifikasi',
      'Belum Ujian',
      '',
      data.foto_id || ''
    ];
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully', row: row }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message, stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Upload file to Google Drive
function uploadToDrive(parameter) {
  try {
    const fileName = parameter.fileName;
    const fileData = parameter.fileData;
    const folderId = parameter.folderId || DRIVE_FOLDER_ID;
    
    if (!fileData) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'No file data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Decode base64
    const decoded = Utilities.base64Decode(fileData);
    
    // Determine MIME type based on extension
    let mimeType = MimeType.JPEG;
    if (fileName.toLowerCase().endsWith('.pdf')) {
      mimeType = MimeType.PDF;
    } else if (fileName.toLowerCase().endsWith('.png')) {
      mimeType = MimeType.PNG;
    }
    
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    
    // Get or create folder
    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      folder = DriveApp.createFolder('SIKOMJAKES_Uploads');
    }
    
    // Save to Drive with unique name
    const timestamp = new Date().getTime();
    const ext = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const uniqueName = baseName + '_' + timestamp + '.' + ext;
    const file = folder.createFile(blob);
    file.setName(uniqueName);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      fileName: uniqueName
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message, stack: error.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get data from specified sheet
function getDataFromSheet(sheetName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: [], headers: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      data: rows,
      headers: headers
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Update participant status (for Admin)
function updateParticipantStatus(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Peserta');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getDataRange();
    const rows = dataRange.getValues();
    
    // Find row by NIK
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][3] == data.nik) { // Column D is NIK (index 3)
        // Update status columns (S=18: Status Verifikasi, T=19: Status Ujian)
        if (data.status_verifikasi) {
          sheet.getRange(i + 1, 19).setValue(data.status_verifikasi);
        }
        if (data.status_ujian) {
          sheet.getRange(i + 1, 20).setValue(data.status_ujian);
        }
        if (data.keputusan) {
          sheet.getRange(i + 1, 21).setValue(data.keputusan);
        }
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Status updated' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Participant not found' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Delete participant (for Admin)
function deleteParticipant(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Peserta');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getDataRange();
    const rows = dataRange.getValues();
    
    // Find row by NIK
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][3] == data.nik) { // Column D is NIK (index 3)
        sheet.deleteRow(i + 1);
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Participant deleted' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Participant not found' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Dashboard stats
function getDashboardStats() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get Peserta data
    let pesertaSheet = ss.getSheetByName('Peserta');
    let totalPeserta = 0;
    let lulus = 0, tidakLulus = 0, belumUjian = 0;
    
    if (pesertaSheet) {
      const pesertaData = pesertaSheet.getDataRange().getValues();
      totalPeserta = pesertaData.length - 1;
      
      for (let i = 1; i < pesertaData.length; i++) {
        const status = pesertaData[i][18]; // Column S: Status Ujian
        if (status === 'Lulus') lulus++;
        else if (status === 'Tidak Lulus') tidakLulus++;
        else belumUjian++;
      }
    }
    
    // Get Formasi data
    let formasiSheet = ss.getSheetByName('Formasi');
    let totalFormasi = 0;
    if (formasiSheet) {
      totalFormasi = formasiSheet.getDataRange().getValues().length - 1;
    }
    
    // Get Bazzetting data
    let bazzettingSheet = ss.getSheetByName('Bazzetting');
    let totalBazzetting = 0;
    if (bazzettingSheet) {
      totalBazzetting = bazzettingSheet.getDataRange().getValues().length - 1;
    }
    
    const stats = {
      totalPeserta: totalPeserta,
      totalJabfung: 5, // Default count
      totalFormasi: totalFormasi,
      pesertaLulus: lulus,
      pesertaTidakLulus: tidakLulus,
      pesertaBelumUjian: belumUjian
    };
    
    const charts = {
      tahun: [1200, 1450, 1680, 2100, 2580, 3100, 3800, 4500, 5200, 5800, 6500, totalPeserta],
      jabfung: { labels: ['Perawat', 'Bidan', 'Dokter Gigi', 'Apoteker', 'Analis Kesehatan'], values: [3200, 4500, 2100, 1500, 800] },
      kelulusan: { lulus: lulus, tidakLulus: tidakLulus, belumUjian: belumUjian },
      provinsi: { labels: ['Jawa Timur', 'Jawa Barat', 'Jawa Tengah', 'DKI Jakarta', 'Lainnya'], values: [3500, 2800, 2200, 1500, Math.max(0, totalPeserta - 10000)] }
    };
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      stats: stats,
      charts: charts
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
