import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Calendar, 
  Mail, 
  Phone, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  FileText
} from 'lucide-react'
import { toast } from 'react-toastify'
import { pesertaAPI, jabfungAPI, formasiAPI } from '../services/api'

const FormulirPendaftaran = () => {
  const [formData, setFormData] = useState({
    nik: '',
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    id_jabfung: '',
    jenjang_jabatan: '',
    id_instansi: '',
    unit_kerja: '',
    email: '',
    nomor_hp: ''
  })
  const [documents, setDocuments] = useState({
    sk_jabatan: null,
    str: null,
    ijazah: null,
    foto: null
  })
  const [jabfungList, setJabfungList] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [loading, setLoading] = useState(false)
  const [nikChecked, setNikChecked] = useState(null)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const [jabfungRes, formasiRes] = await Promise.all([
        jabfungAPI.getAll({ limit: 100 }),
        formasiAPI.getAll({ limit: 100 })
      ])
      if (jabfungRes.data.success) {
        setJabfungList(jabfungRes.data.data)
      }
      // Extract unique instances from formasi
      if (formasiRes.data.success) {
        const instances = formasiRes.data.data.reduce((acc, curr) => {
          if (!acc.find(i => i.id === curr.id_instansi)) {
            acc.push({ id: curr.id_instansi, nama_instansi: curr.nama_instansi })
          }
          return acc
        }, [])
        setInstansiList(instances)
      }
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }

  const handleNikBlur = async () => {
    if (formData.nik.length === 16) {
      try {
        const response = await pesertaAPI.checkNik(formData.nik)
        if (response.data.exists) {
          setNikChecked(response.data)
          setShowWarning(true)
        } else {
          setNikChecked(null)
          setShowWarning(false)
        }
      } catch (error) {
        console.error('Error checking NIK:', error)
      }
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (files[0]) {
      setDocuments({ ...documents, [name]: files[0] })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (showWarning) {
      toast.error('NIK sudah terdaftar dalam sistem')
      return
    }

    setLoading(true)
    try {
      // Submit participant data
      const response = await pesertaAPI.register(formData)
      
      if (response.data.success) {
        toast.success('Pendaftaran berhasil!')
        
        // Upload documents if any
        const participantId = response.data.id
        for (const [key, file] of Object.entries(documents)) {
          if (file) {
            const formDataFile = new FormData()
            formDataFile.append('file', file)
            formDataFile.append('jenis_dokumen', key.toUpperCase())
            await pesertaAPI.uploadDokumen(participantId, formDataFile)
          }
        }
        
        // Reset form
        setFormData({
          nik: '',
          nama_lengkap: '',
          tempat_lahir: '',
          tanggal_lahir: '',
          jenis_kelamin: '',
          id_jabfung: '',
          jenjang_jabatan: '',
          id_instansi: '',
          unit_kerja: '',
          email: '',
          nomor_hp: ''
        })
        setDocuments({
          sk_jabatan: null,
          str: null,
          ijazah: null,
          foto: null
        })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Formulir Pendaftaran Peserta UKOM</h1>
          <p className="text-gray-500">Pendaftaran Uji Kompetensi Jabatan Fungsional Kesehatan</p>
        </div>
      </div>

      {/* Warning Alert */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Peringatan</h3>
              <p className="text-sm text-red-700">
                NIK sudah terdaftar dalam sistem atas nama {nikChecked?.data?.nama_lengkap}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Data Pribadi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIK *</label>
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                onBlur={handleNikBlur}
                maxLength={16}
                required
                className={inputClass}
                placeholder="Masukkan 16 digit NIK"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Sesuai KTP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir *</label>
              <input
                type="text"
                name="tempat_lahir"
                value={formData.tempat_lahir}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir *</label>
              <input
                type="date"
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin *</label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP *</label>
              <input
                type="tel"
                name="nomor_hp"
                value={formData.nomor_hp}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="0821xxxxxxxx"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Data Kepegawaian
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan Fungsional *</label>
              <select
                name="id_jabfung"
                value={formData.id_jabfung}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Pilih Jabatan Fungsional</option>
                {jabfungList.map(jab => (
                  <option key={jab.id} value={jab.id}>{jab.nama_jabfung} - {jab.jenjang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenjang Jabatan *</label>
              <select
                name="jenjang_jabatan"
                value={formData.jenjang_jabatan}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Pilih Jenjang</option>
                <option value="Terampil">Terampil</option>
                <option value="Ahli Pertama">Ahli Pertama</option>
                <option value="Ahli Muda">Ahli Muda</option>
                <option value="Ahli Madya">Ahli Madya</option>
                <option value="Ahli Utama">Ahli Utama</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instansi *</label>
              <select
                name="id_instansi"
                value={formData.id_instansi}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Pilih Instansi</option>
                {instansiList.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.nama_instansi}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kerja *</label>
              <input
                type="text"
                name="unit_kerja"
                value={formData.unit_kerja}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Nama unit kerja"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Dokumen
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SK Jabatan</label>
              <input
                type="file"
                name="sk_jabatan"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className={inputClass}
              />
              <p className="text-xs text-gray-500 mt-1">Format: PDF, JPG, PNG (Max 5MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">STR (Surat Tanda Registrasi)</label>
              <input
                type="file"
                name="str"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ijazah</label>
              <input
                type="file"
                name="ijazah"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
              <input
                type="file"
                name="foto"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || showWarning}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Mengirim...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Daftar Sekarang
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FormulirPendaftaran
