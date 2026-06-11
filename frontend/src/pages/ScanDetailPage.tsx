import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, BarChart2, List, AlertTriangle, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getScan, getScanSummary, getFeatures, getHistograms, getAlerts, type Feature } from '../api/client'

const FEATURE_COLORS: Record<string, string> = {
  email: '#22d3ee', url: '#818cf8', ip: '#34d399', ccn: '#fb923c',
  telephone: '#facc15', domain: '#a78bfa', gps: '#4ade80', ether: '#f472b6',
}
const featureColor = (t: string) => FEATURE_COLORS[t] ?? '#6b7280'

function ProgressBar({ scanId }: { scanId: number }) {
  const [progress, setProgress] = useState<{ percent: string; elapsed?: string } | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/scans/${scanId}/progress`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setProgress(data)
    }
    return () => ws.close()
  }, [scanId])

  if (!progress) return null
  const pct = parseFloat(progress.percent ?? '0')
  return (
    <div className="bg-gray-900 border border-blue-800 rounded-xl p-4 mb-6">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Scanning in progress…</span>
        <span>{progress.elapsed ?? ''}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-blue-400 mt-1.5">{pct.toFixed(1)}%</p>
    </div>
  )
}

type Tab = 'summary' | 'features' | 'histograms' | 'alerts'

export default function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>()
  const id = Number(scanId)
  const [tab, setTab] = useState<Tab>('summary')
  const [featureType, setFeatureType] = useState<string>('')
  const [histType, setHistType] = useState<string>('email')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const limit = 100

  const { data: scan } = useQuery({
    queryKey: ['scan', id],
    queryFn: () => getScan(id).then(r => r.data),
    refetchInterval: (q) => q.state.data?.status === 'running' ? 3000 : false,
  })

  const { data: summary = {} } = useQuery({
    queryKey: ['summary', id],
    queryFn: () => getScanSummary(id).then(r => r.data),
    enabled: scan?.status === 'complete',
  })

  const { data: features = [] } = useQuery({
    queryKey: ['features', id, featureType, search, page],
    queryFn: () => getFeatures(id, { type: featureType || undefined, search: search || undefined, limit, offset: page * limit }).then(r => r.data),
    enabled: tab === 'features' && scan?.status === 'complete',
  })

  const { data: histograms = [] } = useQuery({
    queryKey: ['histograms', id, histType],
    queryFn: () => getHistograms(id, histType).then(r => r.data),
    enabled: tab === 'histograms' && scan?.status === 'complete',
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', id],
    queryFn: () => getAlerts(id).then(r => r.data),
    enabled: tab === 'alerts' && scan?.status === 'complete',
  })

  const summaryData = Object.entries(summary).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count)
  const featureTypes = Object.keys(summary)

  const tabCls = (t: Tab) => `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    tab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'
  }`

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {scan && (
          <Link to={`/cases/${scan.case_id}`} className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors">
            <ChevronLeft size={14} /> Case
          </Link>
        )}
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-100 font-mono truncate max-w-xl">{scan?.image_path.split('/').pop()}</h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{scan?.image_path}</p>
        </div>
        {scan && (
          <div className="text-right shrink-0 ml-4">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              { queued: 'bg-yellow-900/40 text-yellow-400 border-yellow-800', running: 'bg-blue-900/40 text-blue-400 border-blue-800', complete: 'bg-green-900/40 text-green-400 border-green-800', failed: 'bg-red-900/40 text-red-400 border-red-800' }[scan.status]
            }`}>{scan.status}</span>
            {scan.image_hash && <p className="text-xs text-gray-600 mt-1 font-mono">SHA1: {scan.image_hash.slice(0, 12)}…</p>}
          </div>
        )}
      </div>

      {scan?.status === 'running' && <ProgressBar scanId={id} />}

      {scan?.status === 'failed' && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-6 text-sm text-red-400">
          {scan.error_message ?? 'Scan failed.'}
        </div>
      )}

      {scan?.status === 'complete' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            ['Total bytes', scan.total_bytes ? `${(scan.total_bytes / 1e6).toFixed(0)} MB` : '—'],
            ['Duration', scan.elapsed_seconds ? `${scan.elapsed_seconds.toFixed(1)}s` : '—'],
            ['Feature types', Object.keys(summary).length],
            ['Total features', Object.values(summary).reduce((a, b) => a + b, 0).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-base font-bold text-cyan-400">{value}</p>
            </div>
          ))}
        </div>
      )}

      {scan?.status === 'complete' && (
        <>
          <div className="flex border-b border-gray-800 mb-6">
            <button className={tabCls('summary')} onClick={() => setTab('summary')}><BarChart2 size={13} className="inline mr-1.5" />Summary</button>
            <button className={tabCls('features')} onClick={() => setTab('features')}><List size={13} className="inline mr-1.5" />Features</button>
            <button className={tabCls('histograms')} onClick={() => setTab('histograms')}><BarChart2 size={13} className="inline mr-1.5" />Histograms</button>
            <button className={tabCls('alerts')} onClick={() => setTab('alerts')}><AlertTriangle size={13} className="inline mr-1.5" />Alerts {alerts.length > 0 && <span className="ml-1 bg-red-800 text-red-300 text-xs px-1.5 py-0.5 rounded-full">{alerts.length}</span>}</button>
          </div>

          {tab === 'summary' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Features by type</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryData} margin={{ left: 20, right: 20, top: 5, bottom: 60 }}>
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} angle={-40} textAnchor="end" />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#d1d5db' }} itemStyle={{ color: '#22d3ee' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {summaryData.map((entry) => <Cell key={entry.name} fill={featureColor(entry.name)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === 'features' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3">
                <select value={featureType} onChange={e => { setFeatureType(e.target.value); setPage(0) }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none">
                  <option value="">All types</option>
                  {featureTypes.map(t => <option key={t} value={t}>{t} ({summary[t]?.toLocaleString()})</option>)}
                </select>
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 flex-1 min-w-48">
                  <Search size={13} className="text-gray-500" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="Search values…"
                    className="bg-transparent text-sm text-gray-300 focus:outline-none w-full" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-gray-500 uppercase text-left">
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Offset</th>
                      <th className="px-5 py-3 font-medium">Value</th>
                      <th className="px-5 py-3 font-medium">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {features.map((f: Feature) => (
                      <tr key={f.id} className="hover:bg-gray-800/40">
                        <td className="px-5 py-2.5"><span style={{ color: featureColor(f.feature_type) }}>{f.feature_type}</span></td>
                        <td className="px-5 py-2.5 text-gray-500">{f.offset?.toLocaleString() ?? '—'}</td>
                        <td className="px-5 py-2.5 text-gray-200 max-w-xs truncate">{f.value}</td>
                        <td className="px-5 py-2.5 text-gray-500 max-w-xs truncate">{f.context ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-800 flex gap-3 text-xs text-gray-500">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="disabled:opacity-30 hover:text-gray-200 transition-colors">← Prev</button>
                <span>Page {page + 1}</span>
                <button disabled={features.length < limit} onClick={() => setPage(p => p + 1)} className="disabled:opacity-30 hover:text-gray-200 transition-colors">Next →</button>
              </div>
            </div>
          )}

          {tab === 'histograms' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <select value={histType} onChange={e => setHistType(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none">
                  {featureTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {histograms.length === 0 ? (
                <p className="text-sm text-gray-500">No histogram data for this type.</p>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={histograms.slice(0, 20)} layout="vertical" margin={{ left: 120, right: 30 }}>
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis type="category" dataKey="value" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                    <Bar dataKey="count" fill={featureColor(histType)} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {tab === 'alerts' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-500 p-5">No alerts for this scan.</p>
              ) : (
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-gray-500 uppercase text-left">
                      <th className="px-5 py-3 font-medium">Offset</th>
                      <th className="px-5 py-3 font-medium">Value</th>
                      <th className="px-5 py-3 font-medium">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {alerts.map(a => (
                      <tr key={a.id} className="hover:bg-gray-800/40">
                        <td className="px-5 py-2.5 text-gray-500">{a.offset?.toLocaleString() ?? '—'}</td>
                        <td className="px-5 py-2.5 text-red-300">{a.value}</td>
                        <td className="px-5 py-2.5 text-gray-500 max-w-xs truncate">{a.context ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
