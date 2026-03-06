import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  FileSpreadsheet,
  File,
  ChevronLeft,
  ChevronRight,
  Eye,
  User
} from 'lucide-react'
import { pesertaAPI, jabfungAPI } from '../services/api'

const DaftarPeserta = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    id_jabfung: '',
    id_instansi: '',
    status_verifikasi: '',
    status_ujian: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedPeserta, setSelectedPeserta] = useState(null)
  const [jabfungList, setJabfungList] = useState([])

  useEffect(() => {
    fetchJabfung()
  }, [])

  useEffect(() => {
    fetchData()
  }, [pagination.page, search, filters])

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
        ...filters
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

  const handleExport = (type) => {
    console.log('Export:', type)
  }

  const verificationBadge = (status) => {
    const styles = {
      'Belum Diverifikasi': 'bg-yellow-100 text-yellow-800',
      'Lolos Administrasi': 'bg-green-100 text-green-800',
      'Tidak Lolos': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const examBadge = (status) => {
    const styles = {
      'Belum Ujian': 'bg-gray-100 text-gray-800',
      'Sedang Ujian': 'bg-blue-100 text-blue-800',
      'Lulus': 'bg-green-100 text-green-800',
      'Tidak Lulus': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
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
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <File className="w-4 h-4" />
            Export PDF
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
              placeholder="Cari NIK, nama, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filters.id_jabfung}
              onChange={(e) => setFilters({ ...filters, id_jabfung: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Semua Jabfung</option>
              {jabfungList.map(jab => (
                <option key={jab.id} value={jab.id}>{jab.nama_jabfung}</option>
              ))}
            </select>
            <select
              value={filters.status_verifikasi}
              onChange={(e) => setFilters({ ...filters, status_verifikasi: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Status Verifikasi</option>
              <option value="Belum Diverifikasi">Belum Diverifikasi</option>
              <option value="Lolos Administrasi">Lolos Administrasi</option>
              <option value="Tidak Lolos">Tidak Lolos</option>
            </select>
            <select
              value={filters.status_ujian}
              onChange={(e) => setFilters({ ...filters, status_ujian: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Status Ujian</option>
              <option value="Belum Ujian">Belum Ujian</option>
              <option value="Sedang Ujian">Sedang Ujian</option>
              <option value="Lulus">Lulus</option>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">NIK</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Jabatan Fungsional</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Instansi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Tanggal Daftar</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Status Verifikasi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Status Ujian</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-mono">
                      {item.nik}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {item.nama_lengkap}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.nama_jabfung || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.nama_instansi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {verificationBadge(item.status_verifikasi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {examBadge(item.status_ujian)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
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
                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Verifikasi</p>
                    {verificationBadge(selectedPeserta.status_verifikasi)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ujian</p>
                    {examBadge(selectedPeserta.status_ujian)}
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
    </div>
  )
}

export default DaftarPeserta
