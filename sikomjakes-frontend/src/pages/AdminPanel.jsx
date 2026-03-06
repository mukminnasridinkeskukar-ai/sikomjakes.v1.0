import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  FileText, 
  Building2,
  History,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search
} from 'lucide-react'
import { toast } from 'react-toastify'
import { adminAPI, pesertaAPI, jabfungAPI, formasiAPI } from '../services/api'

const Tabs = {
  PESERTA: 'peserta',
  JABFUNG: 'jabfung',
  FORMASI: 'formasi',
  INSTANSI: 'instansi',
  AUDIT: 'audit'
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(Tabs.PESERTA)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    fetchData()
  }, [activeTab, pagination.page, search])

  const fetchData = async () => {
    setLoading(true)
    try {
      let response
      switch (activeTab) {
        case Tabs.PESERTA:
          response = await pesertaAPI.getAll({ page: pagination.page, limit: pagination.limit, search })
          break
        case Tabs.JABFUNG:
          response = await jabfungAPI.getAll({ page: pagination.page, limit: pagination.limit, search })
          break
        case Tabs.FORMASI:
          response = await formasiAPI.getAll({ page: pagination.page, limit: pagination.limit, search })
          break
        case Tabs.INSTANSI:
          response = await adminAPI.getInstansi()
          break
        case Tabs.AUDIT:
          response = await adminAPI.getAuditLogs({ page: pagination.page, limit: pagination.limit })
          break
        default:
          response = await pesertaAPI.getAll({ page: pagination.page, limit: pagination.limit, search })
      }
      
      if (response.data.success) {
        setData(activeTab === Tabs.INSTANSI ? response.data.data : response.data.data)
        if (response.data.pagination) {
          setPagination(prev => ({ ...prev, ...response.data.pagination }))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id, status) => {
    try {
      await adminAPI.verifyPeserta(id, { status_verifikasi: status })
      toast.success('Verifikasi berhasil diperbarui')
      fetchData()
    } catch (error) {
      toast.error('Gagal memperbarui verifikasi')
    }
  }

  const handleInputHasil = async (e) => {
    e.preventDefault()
    try {
      await adminAPI.inputHasil(selectedItem.id, formData)
      toast.success('Hasil UKOM berhasil disimpan')
      setShowModal(false)
      fetchData()
    } catch (error) {
      toast.error('Gagal menyimpan hasil')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    
    try {
      switch (activeTab) {
        case Tabs.JABFUNG:
          await jabfungAPI.delete(id)
          break
        case Tabs.FORMASI:
          await formasiAPI.delete(id)
          break
      }
      toast.success('Data berhasil dihapus')
      fetchData()
    } catch (error) {
      toast.error('Gagal menghapus data')
    }
  }

  const openModal = (type, item = null) => {
    setModalType(type)
    setSelectedItem(item)
    setFormData(item || {})
    setShowModal(true)
  }

  const tabs = [
    { id: Tabs.PESERTA, label: 'Verifikasi Peserta', icon: Users },
    { id: Tabs.JABFUNG, label: 'Data Jabfung', icon: Briefcase },
    { id: Tabs.FORMASI, label: 'Data Formasi', icon: FileText },
    { id: Tabs.INSTANSI, label: 'Data Instansi', icon: Building2 },
    { id: Tabs.AUDIT, label: 'Audit Log', icon: History }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Admin</h1>
          <p className="text-gray-500">Manajemen sistem SIKOMJAKES</p>
        </div>
        {activeTab === Tabs.JABFUNG && (
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Tambah Jabfung
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="glass-card p-1 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {activeTab !== Tabs.AUDIT && activeTab !== Tabs.INSTANSI && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto"></div>
            <p className="mt-2">Memuat data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada data</div>
        ) : (
          <>
            {activeTab === Tabs.PESERTA && (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">NIK</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Jabfung</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Verifikasi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Status Ujian</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{item.nik}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.nama_lengkap}</td>
                      <td className="px-4 py-3 text-sm">{item.nama_jabfung}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status_verifikasi}
                          onChange={(e) => handleVerify(item.id, e.target.value)}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          <option value="Belum Diverifikasi">Belum Diverifikasi</option>
                          <option value="Lolos Administrasi">Lolos Administrasi</option>
                          <option value="Tidak Lolos">Tidak Lolos</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.status_ujian === 'Lulus' ? 'bg-green-100 text-green-800' :
                          item.status_ujian === 'Tidak Lulus' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status_ujian}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal('hasil', item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Input Hasil"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {activeTab === Tabs.JABFUNG && (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Nama Jabatan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Jenjang</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{item.nama_jabfung}</td>
                      <td className="px-4 py-3 text-sm">{item.jenjang}</td>
                      <td className="px-4 py-3 text-sm">{item.kategori}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal('edit', item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === Tabs.FORMASI && (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Jabfung</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Instansi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Jumlah</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Tahun</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{item.nama_jabfung}</td>
                      <td className="px-4 py-3 text-sm">{item.nama_instansi}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.jumlah_formasi}</td>
                      <td className="px-4 py-3 text-sm">{item.tahun_formasi}</td>
                      <td className="px-4 py-3 text-sm">{item.status}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === Tabs.INSTANSI && (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Kode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Nama Instansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{item.kode_instansi}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.nama_instansi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === Tabs.AUDIT && (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Aktivitas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">Tabel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-sm">{item.nama_lengkap || item.username || 'System'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.aktivitas}</td>
                      <td className="px-4 py-3 text-sm">{item.tabel_terkait}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {modalType === 'create' ? 'Tambah' : modalType === 'edit' ? 'Edit' : 'Input Hasil UKOM'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === Tabs.PESERTA && modalType === 'hasil' ? (
              <form onSubmit={handleInputHasil} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Peserta</label>
                  <input type="text" value={selectedItem?.nama_lengkap || ''} disabled className="w-full px-3 py-2 border rounded bg-gray-50" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Teori</label>
                    <input type="number" step="0.01" name="nilai_teori" onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Praktik</label>
                    <input type="number" step="0.01" name="nilai_praktik" onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Wawancara</label>
                    <input type="number" step="0.01" name="nilai_wawancara" onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Kelulusan</label>
                  <select name="status_kelulusan" onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full px-3 py-2 border rounded" required>
                    <option value="">Pilih Status</option>
                    <option value="LULUS">LULUS</option>
                    <option value="TIDAK LULUS">TIDAK LULUS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <textarea name="catatan_penguji" onChange={(e) => setFormData({...formData, [e.target.name]: e.target.value})} className="w-full px-3 py-2 border rounded" rows={3}></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Simpan</button>
                </div>
              </form>
            ) : (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jabatan</label>
                  <input type="text" defaultValue={selectedItem?.nama_jabfung || ''} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenjang</label>
                  <select defaultValue={selectedItem?.jenjang || ''} className="w-full px-3 py-2 border rounded">
                    <option value="Terampil">Terampil</option>
                    <option value="Ahli Pertama">Ahli Pertama</option>
                    <option value="Ahli Muda">Ahli Muda</option>
                    <option value="Ahli Madya">Ahli Madya</option>
                    <option value="Ahli Utama">Ahli Utama</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <input type="text" defaultValue={selectedItem?.kategori || ''} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Simpan</button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
