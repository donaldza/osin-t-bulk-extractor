import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FolderPlus, FolderOpen } from 'lucide-react'
import { getCases, createCase } from '../api/client'

export default function CasesPage() {
  const qc = useQueryClient()
  const { data: cases = [], isLoading } = useQuery({ queryKey: ['cases'], queryFn: () => getCases().then(r => r.data) })
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [showForm, setShowForm] = useState(false)

  const create = useMutation({
    mutationFn: () => createCase(name, desc || undefined).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cases'] }); setName(''); setDesc(''); setShowForm(false) },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-100">Cases</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <FolderPlus size={14} /> New Case
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Create Case</h2>
          <div className="space-y-3">
            <input placeholder="Case name *" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-600" />
            <textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-600 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => create.mutate()} disabled={!name || create.isPending}
                className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">
                {create.isPending ? 'Creating…' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-200 px-4 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : cases.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No cases yet. Create one to start scanning.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cases.map(c => (
            <Link key={c.id} to={`/cases/${c.id}`}
              className="bg-gray-900 border border-gray-800 hover:border-cyan-800 rounded-xl p-5 flex items-center gap-4 transition-colors group">
              <FolderOpen size={20} className="text-cyan-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 group-hover:text-cyan-300 transition-colors">{c.name}</p>
                {c.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  c.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'
                }`}>{c.status}</span>
                <p className="text-xs text-gray-600 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
