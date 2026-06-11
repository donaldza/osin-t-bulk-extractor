import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Play, ScanLine } from 'lucide-react'
import { getCase, getScans, createScan, type Scan } from '../api/client'

function statusBadge(status: Scan['status']) {
  const map = {
    queued:   'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    running:  'bg-blue-900/40 text-blue-400 border-blue-800 animate-pulse',
    complete: 'bg-green-900/40 text-green-400 border-green-800',
    failed:   'bg-red-900/40 text-red-400 border-red-800',
  }
  return `text-xs px-2 py-0.5 rounded-full border ${map[status]}`
}

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const id = Number(caseId)
  const qc = useQueryClient()

  const { data: caseData } = useQuery({ queryKey: ['case', id], queryFn: () => getCase(id).then(r => r.data) })
  const { data: scans = [] } = useQuery({ queryKey: ['scans', id], queryFn: () => getScans(id).then(r => r.data), refetchInterval: 5000 })

  const [imagePath, setImagePath] = useState('')
  const [showForm, setShowForm] = useState(false)

  const submit = useMutation({
    mutationFn: () => createScan(id, imagePath).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['scans', id] }); setImagePath(''); setShowForm(false) },
  })

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link to="/cases" className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors">
          <ChevronLeft size={14} /> Cases
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-100">{caseData?.name ?? '…'}</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <Play size={13} /> New Scan
        </button>
      </div>

      {caseData?.description && <p className="text-sm text-gray-500 mb-6">{caseData.description}</p>}

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">New Scan</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Image / file path</label>
              <input placeholder="/data/disk.img" value={imagePath} onChange={e => setImagePath(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-600 font-mono" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => submit.mutate()} disabled={!imagePath || submit.isPending}
                className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
                {submit.isPending ? 'Submitting…' : 'Start Scan'}
              </button>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-200 px-4 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <ScanLine size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-300">Scans</h2>
          <span className="text-xs text-gray-600 ml-auto">auto-refreshes</span>
        </div>
        {scans.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">No scans yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-5 py-3 text-left font-medium">Image</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Size</th>
                <th className="px-5 py-3 text-left font-medium">Duration</th>
                <th className="px-5 py-3 text-left font-medium">Started</th>
                <th className="px-5 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {scans.map(scan => (
                <tr key={scan.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-gray-300 max-w-xs truncate font-mono text-xs">{scan.image_path}</td>
                  <td className="px-5 py-3"><span className={statusBadge(scan.status)}>{scan.status}</span></td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{scan.total_bytes ? `${(scan.total_bytes / 1e6).toFixed(0)} MB` : '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{scan.elapsed_seconds ? `${scan.elapsed_seconds.toFixed(1)}s` : '—'}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{scan.started_at ? new Date(scan.started_at).toLocaleString() : '—'}</td>
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
