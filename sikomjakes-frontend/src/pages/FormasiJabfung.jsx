import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet,
  File,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { formasiAPI, jabfungAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const FormasiJabfung = () => {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchData()
  }, [pagination.page, search])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await formasiAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search
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

  const handleExport = (type) => {
    // Export logic would go here
    console.log('Export:', type)
  }

  const statusBadge = (status) => {
    const styles = {
      'Aktif': 'bg-green-100 text-green-800',
      'Nonaktif': 'bg-gray-100 text-gray-800',
      'Expired': 'bg-red-100 text-red-800'
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
          <h1 className="text-2xl font-bold text-gray-800">Formasi Jabfung KemenPAN</h1>
          <p className="text-gray-500">Data formasi jabatan fungsional kesehatan</p>
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
              placeholder="Cari nama jabatan, unit kerja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
              <option value="Expired">Expired</option>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Nama Jabatan Fungsional</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Jenjang Jabatan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Unit Kerja</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Jumlah Formasi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Tahun Formasi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {item.nama_jabfung}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.jenjang_jabfung}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.nama_instansi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                      {item.jumlah_formasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.tahun_formasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {statusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedItem(item)}
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
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detail Formasi</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nama Jabatan</p>
                  <p className="font-medium text-gray-800">{selectedItem.nama_jabfung}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jenjang</p>
                  <p className="font-medium text-gray-800">{selectedItem.jenjang_jabfung}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unit Kerja</p>
                  <p className="font-medium text-gray-800">{selectedItem.nama_instansi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kode Instansi</p>
                  <p className="font-medium text-gray-800">{selectedItem.kode_instansi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jumlah Formasi</p>
                  <p className="font-medium text-gray-800">{selectedItem.jumlah_formasi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tahun Formasi</p>
                  <p className="font-medium text-gray-800">{selectedItem.tahun_formasi}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {statusBadge(selectedItem.status)}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
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

export default FormasiJabfung
