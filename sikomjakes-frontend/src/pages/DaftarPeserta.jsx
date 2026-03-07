import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  FileSpreadsheet,
  File,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  X,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react'
import { pesertaAPI, jabfungAPI } from '../services/api'

const DaftarPeserta = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    id_jabfung: '',
    status: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedPeserta, setSelectedPeserta] = useState(null)
  const [jabfungList, setJabfungList] = useState([])
  
  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const lightboxRef = useRef(null)

  useEffect(() => {
    fetchJabfung()
  }, [])

  useEffect(() => {
    fetchData()
  }, [pagination.page, search, filters])

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null)
        setZoomLevel(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage])

  const fetchJabfung = async () => {
    try {
      const response = await jabfungAPI.getAll({ limit: 100 })
      if (response.data.success) {
        setJabfungList(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching jabfung:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await pesertaAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        id_jabfung: filters.id_jabfung || undefined,
        status_verifikasi: filters.status === 'Terdaftar' || filters.status === 'Lolos Administrasi' || filters.status === 'Tidak Lolos' ? filters.status : undefined,
        status_ujian: filters.status === 'Lulus' || filters.status === 'Tidak Lulus' ? filters.status : undefined
      })
      if (response.data.success) {
        setData(response.data.data)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (id) => {
    try {
      const response = await pesertaAPI.getById(id)
      if (response.data.success) {
        setSelectedPeserta(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching detail:', error)
    }
  }

  const handleExport = async () => {
    try {
      // Export all data without pagination
      const response = await pesertaAPI.getAll({
        page: 1,
        limit: 10000,
        search,
        id_jabfung: filters.id_jabfung || undefined,
        status_verifikasi: filters.status === 'Terdaftar' || filters.status === 'Lolos Administrasi' || filters.status === 'Tidak Lolos' ? filters.status : undefined,
        status_ujian: filters.status === 'Lulus' || filters.status === 'Tidak Lulus' ? filters.status : undefined
      })
      
      if (response.data.success && response.data.data.length > 0) {
        const exportData = response.data.data.map((item, index) => ({
          'No': index + 1,
          'NIK': item.nik,
          'Nama': item.nama_lengkap,
          'Unit Kerja': item.unit_kerja || '-',
          'Jabatan Fungsional': item.nama_jabfung || '-',
          'Jenjang': item.jenjang_jabatan || '-',
          'Status Verifikasi': item.status_verifikasi || '-',
          'Status Ujian': item.status_ujian || '-',
          'Tanggal Daftar': item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'
        }))

        // Create CSV
        const headers = Object.keys(exportData[0])
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n')

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Daftar_Peserta_UKOM_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  // Status badge - combined verification and exam status
  const getStatusBadge = (item) => {
    // Priority: Ujian status > Verification status
    let status, colorClass
    
    if (item.status_ujian === 'Lulus') {
      status = 'Lulus UKOM'
      colorClass = 'bg-green-100 text-green-800 border-green-200'
    } else if (item.status_ujian === 'Tidak Lulus') {
      status = 'Tidak Lulus'
      colorClass = 'bg-red-100 text-red-800 border-red-200'
    } else if (item.status_verifikasi === 'Lolos Administrasi') {
      status = 'Lolos Administrasi'
      colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'
    } else if (item.status_verifikasi === 'Tidak Lolos') {
      status = 'Tidak Lolos'
      colorClass = 'bg-red-100 text-red-800 border-red-200'
    } else {
      status = 'Terdaftar'
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
        {status}
      </span>
    )
  }

  // Jenjang badge
  const getJenjangBadge = (jenjang) => {
    const styles = {
      'Ahli Pertama': 'bg-purple-100 text-purple-800 border-purple-200',
      'Ahli Muda': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Ahli Madya': 'bg-blue-100 text-blue-800 border-blue-200',
      'Ahli Utama': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Terampil': 'bg-orange-100 text-orange-800 border-orange-200',
      'Mahir': 'bg-amber-100 text-amber-800 border-amber-200',
      'Penyelia': 'bg-red-100 text-red-800 border-red-200'
    }
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${styles[jenjang] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {jenjang || '-'}
      </span>
    )
  }

  // Jabatan fungsional badge with color
  const getJabfungBadge = (jabfung) => {
    const colors = {
      'Perawat': 'bg-teal-500',
      'Bidan': 'bg-pink-500',
      'Nutrisionis': 'bg-green-500',
      'Radiografer': 'bg-indigo-500',
      'Apoteker': 'bg-orange-500',
      'Farmasi': 'bg-orange-500',
      'Tenaga Kesehatan': 'bg-blue-500',
      'Dokter': 'bg-red-500',
      'Paramedis': 'bg-cyan-500'
    }
    
    const colorClass = colors[jabfung] || 'bg-gray-500'
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colorClass}`}>
        {jabfung || '-'}
      </span>
    )
  }

  // Photo click handler
  const handlePhotoClick = (foto, nama) => {
    if (foto) {
      setLightboxImage({ src: `/uploads/${foto}`, nama })
      setZoomLevel(1)
    }
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  // Close lightbox when clicking outside
  const handleLightboxClick = (e) => {
    if (e.target === lightboxRef.current) {
      setLightboxImage(null)
      setZoomLevel(1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Peserta UKOM</h1>
          <p className="text-gray-500">Data peserta Uji Kompetensi Jabatan Fungsional</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.id_jabfung}
              onChange={(e) => setFilters({ ...filters, id_jabfung: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">Semua Jabfung</option>
              {jabfungList.map(jab => (
                <option key={jab.id} value={jab.id}>{jab.nama_jabfung}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">Semua Status</option>
              <option value="Terdaftar">Terdaftar</option>
              <option value="Lolos Administrasi">Lolos Administrasi</option>
              <option value="Tidak Lolos">Tidak Lolos</option>
              <option value="Lulus">Lulus UKOM</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider w-16">No</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider w-20">Foto</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider min-w-[180px]">Nama</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider min-w-[200px]">Unit Kerja</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider min-w-[150px]">Jabatan Fungsional</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider w-32">Jenjang</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider w-36">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-primary-800 uppercase tracking-wider w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {item.foto ? (
                        <button
                          onClick={() => handlePhotoClick(item.foto, item.nama_lengkap)}
                          className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500 transition-all hover:scale-105 shadow-sm"
                        >
                          <img 
                            src={`/uploads/${item.foto}`} 
                            alt={item.nama_lengkap}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-800">
                        {item.nama_lengkap}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 max-w-[200px] truncate" title={item.unit_kerja}>
                      {item.unit_kerja || item.nama_instansi || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getJabfungBadge(item.nama_jabfung)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getJenjangBadge(item.jenjang_jabatan)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(item)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className="font-medium">{pagination.total}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        pagination.page === pageNum 
                          ? 'bg-primary-600 text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPeserta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Detail Peserta</h3>
              <button
                onClick={() => setSelectedPeserta(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Data Pribadi
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">NIK</p>
                    <p className="font-medium">{selectedPeserta.nik}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nama Lengkap</p>
                    <p className="font-medium">{selectedPeserta.nama_lengkap}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tempat/Tanggal Lahir</p>
                    <p className="font-medium">{selectedPeserta.tempat_lahir}, {selectedPeserta.tanggal_lahir}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jenis Kelamin</p>
                    <p className="font-medium">{selectedPeserta.jenis_kelamin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedPeserta.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nomor HP</p>
                    <p className="font-medium">{selectedPeserta.nomor_hp}</p>
                  </div>
                </div>
              </div>

              {/* Job Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Data Kepegawaian</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Jabatan Fungsional</p>
                    <p className="font-medium">{selectedPeserta.nama_jabfung || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jenjang Jabatan</p>
                    <p className="font-medium">{selectedPeserta.jenjang_jabatan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Instansi</p>
                    <p className="font-medium">{selectedPeserta.nama_instansi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit Kerja</p>
                    <p className="font-medium">{selectedPeserta.unit_kerja || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Status</h4>
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Verifikasi</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedPeserta.status_verifikasi === 'Lolos Administrasi' ? 'bg-green-100 text-green-800' :
                      selectedPeserta.status_verifikasi === 'Tidak Lolos' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedPeserta.status_verifikasi}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ujian</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedPeserta.status_ujian === 'Lulus' ? 'bg-green-100 text-green-800' :
                      selectedPeserta.status_ujian === 'Tidak Lulus' ? 'bg-red-100 text-red-800' :
                      selectedPeserta.status_ujian === 'Sedang Ujian' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPeserta.status_ujian}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPeserta(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            ref={lightboxRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            onClick={handleLightboxClick}
          >
            {/* Close button */}
            <button
              onClick={() => { setLightboxImage(null); setZoomLevel(1) }}
              className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Zoom controls */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <button
                onClick={handleZoomOut}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <span className="px-3 py-2 bg-white/20 text-white rounded-lg font-medium">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image info */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
              <p className="text-white font-medium">{lightboxImage.nama}</p>
            </div>

            {/* Image */}
            <motion.img
              src={lightboxImage.src}
              alt={lightboxImage.nama}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DaftarPeserta
