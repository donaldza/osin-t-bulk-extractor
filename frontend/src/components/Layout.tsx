import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { HardDrive, FolderOpen, LayoutDashboard, LogOut } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('token'); navigate('/login') }

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      isActive ? 'bg-cyan-900 text-cyan-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
    }`

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
            <HardDrive size={18} />
            <span>bulk_extractor</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Forensics Platform</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" end className={navCls}>
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>
          <NavLink to="/cases" className={navCls}>
            <FolderOpen size={15} /> Cases
          </NavLink>
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-200 transition-colors w-full px-3 py-2 rounded-md hover:bg-gray-800">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-950 p-6">
        <Outlet />
      </main>
    </div>
  )
}
