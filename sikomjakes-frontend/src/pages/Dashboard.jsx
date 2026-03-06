import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Chart from 'react-apexcharts'
import { 
  Users, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Activity,
  Heart
} from 'lucide-react'
import { dashboardAPI } from '../services/api'

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value)
    const incrementTime = duration / end
    
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, Math.max(incrementTime, 10))

    return () => clearInterval(timer)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-6 hover:scale-[1.02] transition-transform"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">
          <AnimatedCounter value={value} />
        </h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPeserta: 0,
    totalJabfung: 0,
    totalFormasi: 0,
    pesertaLulus: 0,
    pesertaTidakLulus: 0
  })
  const [chartData, setChartData] = useState({
    tahun: [],
    jabfung: [],
    kelulusan: [],
    provinsi: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tahunRes, jabfungRes, kelulusanRes, provinsiRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getChartTahun(),
        dashboardAPI.getChartJabfung(),
        dashboardAPI.getChartKelulusan(),
        dashboardAPI.getChartProvinsi()
      ])

      if (statsRes.data.success) {
        setStats(statsRes.data.data)
      }
      if (tahunRes.data.success) {
        setChartData(prev => ({ ...prev, tahun: tahunRes.data.data }))
      }
      if (jabfungRes.data.success) {
        setChartData(prev => ({ ...prev, jabfung: jabfungRes.data.data }))
      }
      if (kelulusanRes.data.success) {
        setChartData(prev => ({ ...prev, kelulusan: kelulusanRes.data.data }))
      }
      if (provinsiRes.data.success) {
        setChartData(prev => ({ ...prev, provinsi: provinsiRes.data.data }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  }

  // Chart Tahun - Line
  const tahunChartOptions = {
    ...chartOptions,
    charts: {
      type: 'area',
      toolbar: { show: false }
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    colors: ['#3b82f6']
  }

  const tahunChartSeries = [{
    name: 'Jumlah Peserta',
    data: chartData.tahun.map(d => d.jumlah)
  }]

  // Chart Jabfung - Bar
  const jabfungChartOptions = {
    ...chartOptions,
    chart: {
      type: 'bar',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: true
      }
    },
    colors: ['#14b8a6']
  }

  const jabfungChartSeries = [{
    name: 'Jumlah Peserta',
    data: chartData.jabfung.map(d => d.jumlah)
  }]

  // Chart Kelulusan - Donut
  const kelulusanChartOptions = {
    ...chartOptions,
    chart: {
      type: 'donut',
      toolbar: { show: false }
    },
    colors: ['#22c55e', '#ef4444', '#94a3b8'],
    labels: ['Lulus', 'Tidak Lulus', 'Belum Ujian']
  }

  const kelulusanChartSeries = chartData.kelulusan.map(d => d.value)

  // Chart Provinsi - Pie
  const provinsiChartOptions = {
    ...chartOptions,
    chart: {
      type: 'pie',
      toolbar: { show: false }
    }
  }

  const provinsiChartSeries = chartData.provinsi.map(d => d.jumlah)
  const provinsiLabels = chartData.provinsi.map(d => d.provinsi)

  const kelulusanPercentage = stats.totalPeserta > 0 
    ? Math.round((stats.pesertaLulus / stats.totalPeserta) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Statistik Uji Kompetensi Jabatan Kesehatan</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-health-100 text-health-700 rounded-full text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Real-time
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Peserta UKOM" 
          value={stats.totalPeserta} 
          icon={Users} 
          color="bg-gradient-to-br from-primary-500 to-primary-600"
          delay={0}
        />
        <StatCard 
          title="Total Jabfung Terdaftar" 
          value={stats.totalJabfung} 
          icon={Briefcase} 
          color="bg-gradient-to-br from-health-500 to-health-600"
          delay={0.1}
        />
        <StatCard 
          title="Total Formasi Nasional" 
          value={stats.totalFormasi} 
          icon={FileText} 
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0.2}
        />
        <StatCard 
          title="Peserta Lulus" 
          value={stats.pesertaLulus} 
          icon={CheckCircle} 
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.3}
        />
        <StatCard 
          title="Peserta Tidak Lulus" 
          value={stats.pesertaTidakLulus} 
          icon={XCircle} 
          color="bg-gradient-to-br from-red-500 to-red-600"
          delay={0.4}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Peserta per Tahun */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grafik Peserta UKOM per Tahun</h3>
          <div className="h-80">
            <Chart
              options={tahunChartOptions}
              series={tahunChartSeries}
              type="area"
              height="100%"
            />
          </div>
        </motion.div>

        {/* Chart Peserta per Jenis Jabfung */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grafik Peserta per Jenis Jabfung</h3>
          <div className="h-80">
            <Chart
              options={{
                ...jabfungChartOptions,
                xaxis: {
                  categories: chartData.jabfung.map(d => d.nama)
                }
              }}
              series={jabfungChartSeries}
              type="bar"
              height="100%"
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Kelulusan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grafik Kelulusan Peserta</h3>
          <div className="h-80 flex items-center justify-center">
            <Chart
              options={kelulusanChartOptions}
              series={kelulusanChartSeries}
              type="donut"
              height={320}
            />
          </div>
        </motion.div>

        {/* Chart Provinsi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grafik Provinsi Peserta</h3>
          <div className="h-80 flex items-center justify-center">
            <Chart
              options={{
                ...provinsiChartOptions,
                labels: provinsiLabels
              }}
              series={provinsiChartSeries}
              type="pie"
              height={320}
            />
          </div>
        </motion.div>
      </div>

      {/* Progress Bar Kelulusan & Animated Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Kelulusan UKOM</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tingkat Kelulusan</span>
                <span className="font-semibold text-gray-800">{kelulusanPercentage}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${kelulusanPercentage}%` }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="h-full bg-gradient-to-r from-green-500 to-health-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.pesertaLulus}</p>
                <p className="text-xs text-gray-500">Lulus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.pesertaTidakLulus}</p>
                <p className="text-xs text-gray-500">Tidak Lulus</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {stats.totalPeserta - stats.pesertaLulus - stats.pesertaTidakLulus}
                </p>
                <p className="text-xs text-gray-500">Belum Ujian</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Animated Healthcare Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tenaga Kesehatan</h3>
          <div className="grid grid-cols-3 gap-6 py-8">
            {[
              { icon: Heart, label: 'Dokter', color: 'text-red-500' },
              { icon: Users, label: 'Perawat', color: 'text-blue-500' },
              { icon: Activity, label: 'Apoteker', color: 'text-green-500' }
            ].map((item, index) => (
              <motion.div
                key={index}
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3
                }}
                className="flex flex-col items-center"
              >
                <div className={`p-4 rounded-full bg-gray-100 ${item.color}`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <span className="mt-2 text-sm text-gray-600">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
