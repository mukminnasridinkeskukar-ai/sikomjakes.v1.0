import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Chart from 'react-apexcharts'
import { Building2, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { formasiAPI } from '../services/api'

const BazzettingFormasi = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({ tersedia: 0, kekurangan: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await formasiAPI.getBazzetting()
      if (response.data.success) {
        setData(response.data.data)
        
        // Calculate chart data
        const tersedia = response.data.data.filter(d => d.status_kebutuhan === 'Terpenuhi').length
        const kekurangan = response.data.data.filter(d => d.status_kebutuhan === 'Kekurangan').length
        setChartData({ tersedia, kekurangan })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status) => {
    const styles = {
      'Terpenuhi': 'bg-green-100 text-green-800',
      'Kekurangan': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  // Pie chart for SDM
  const sdmChartOptions = {
    chart: {
      type: 'pie',
      toolbar: { show: false }
    },
    labels: ['SDM Tersedia', 'Kekurangan SDM'],
    colors: ['#22c55e', '#ef4444'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    }
  }

  const sdmChartSeries = [chartData.tersedia, chartData.kekurangan]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bazzetting Formasi</h1>
          <p className="text-gray-500">Distribusi kebutuhan jabatan fungsional kesehatan</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Unit Kerja</p>
              <p className="text-2xl font-bold text-gray-800">{data.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terpenuhi</p>
              <p className="text-2xl font-bold text-gray-800">{chartData.tersedia}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Kekurangan</p>
              <p className="text-2xl font-bold text-gray-800">{chartData.kekurangan}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grafik Kekurangan SDM Kesehatan</h3>
          <div className="h-80 flex items-center justify-center">
            <Chart
              options={sdmChartOptions}
              series={sdmChartSeries}
              type="donut"
              height={320}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Kebutuhan per Unit</h3>
          <div className="overflow-y-auto h-80">
            <div className="space-y-3">
              {data.slice(0, 10).map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{item.nama_instansi}</span>
                    {statusBadge(item.status_kebutuhan)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Kebutuhan</p>
                      <p className="font-semibold">{item.kebutuhan_ideal}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tersedia</p>
                      <p className="font-semibold">{item.sdm_tersedia}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Selisih</p>
                      <p className={`font-semibold ${item.selisih < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.selisih}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Instansi</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Jenis Jabfung</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Kebutuhan Ideal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase">SDM Tersedia</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Selisih</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary-800 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.nama_instansi}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.nama_jabfung} ({item.jenjang})</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{item.kebutuhan_ideal}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.sdm_tersedia}</td>
                    <td className={`px-6 py-4 text-sm font-semibold ${item.selisih < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.selisih}
                    </td>
                    <td className="px-6 py-4">{statusBadge(item.status_kebutuhan)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default BazzettingFormasi
