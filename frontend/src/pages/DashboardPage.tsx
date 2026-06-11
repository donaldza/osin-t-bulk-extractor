import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FolderOpen, ScanLine, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { getCases, getScans, type Scan } from '../api/client'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function statusBadge(status: Scan['status']) {
  const map = {
    queued:   'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    running:  'bg-blue-900/40 text-blue-400 border-blue-800',
    complete: 'bg-green-900/40 text-green-400 border-green-800',
    failed:   'bg-red-900/40 text-red-400 border-red-800',
  }
  return `text-xs px-2 py-0.5 rounded-full border ${map[status]}`
}

export default function DashboardPage() {
  const { data: cases = [] } = useQuery({ queryKey: ['cases'], queryFn: () => getCases().then(r => r.data) })

  const allScansQueries = useQuery({
    queryKey: ['all-scans', cases.map(c => c.id)],
    enabled: cases.length > 0,
    queryFn: async () => {
      const results = await Promise.all(cases.map(c => getScans(c.id).then(r => r.data)))
      return results.flat()
    },
  })

  const scans: Scan[] = allScansQueries.data ?? []
  const running = scans.filter(s => s.status === 'running').length
  const complete = scans.filter(s => s.status === 'complete').length
  const failed = scans.filter(s => s.status === 'failed').length
  const recentScans = [...scans].sort((a, b) => b.id - a.id).slice(0, 8)

  return (
    <div>
      <h1 className="text-lg font-bold text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Cases" value={cases.length} icon={FolderOpen} color="text-cyan-400" />
        <StatCard label="Running" value={running} icon={Clock} color="text-blue-400" />
        <StatCard label="Completed" value={complete} icon={CheckCircle} color="text-green-400" />
        <StatCard label="Failed" value={failed} icon={AlertTriangle} color="text-red-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <ScanLine size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-300">Recent Scans</h2>
        </div>
        {recentScans.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">No scans yet. <Link to="/cases" className="text-cyan-400 hover:underline">Create a case</Link> to get started.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left font-medium">Image</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Size</th>
                <th className="px-5 py-3 text-left font-medium">Time</th>
                <th className="px-5 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentScans.map(scan => (
                <tr key={scan.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-gray-300 truncate max-w-xs">{scan.image_path.split('/').pop()}</td>
                  <td className="px-5 py-3"><span className={statusBadge(scan.status)}>{scan.status}</span></td>
                  <td className="px-5 py-3 text-gray-400">{scan.total_bytes ? `${(scan.total_bytes / 1e6).toFixed(0)} MB` : '—'}</td>
                  <td className="px-5 py-3 text-gray-400">{scan.elapsed_seconds ? `${scan.elapsed_seconds.toFixed(1)}s` : '—'}</td>
                  <td className="px-5 py-3">
                    <Link to={`/scans/${scan.id}`} className="text-xs text-cyan-400 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
