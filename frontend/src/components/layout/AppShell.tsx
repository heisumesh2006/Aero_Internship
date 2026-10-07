import { useState } from 'react'
import { ArrowUpRight, FileStack, LayoutDashboard, MapPinned, Menu, Plus, Radio, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useBackendHealth } from '../../hooks/useBackendHealth'
import { API_BASE_URL } from '../../services/api'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Dataset', icon: Plus },
  { to: '/files', label: 'Files', icon: FileStack },
]

function pageLabel(path: string) {
  if (path === '/') return ['Overview', 'Your geospatial workspace at a glance.']
  if (path === '/upload') return ['Upload dataset', 'Transform raw spatial data into insight.']
  if (path === '/files') return ['Dataset library', 'Every file you have analyzed, in one place.']
  return ['Dataset explorer', 'Inspect the geometry behind every measurement.']
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const health = useBackendHealth()
  const [title, subtitle] = pageLabel(location.pathname)

  return <div className="min-h-screen bg-[#07131f] text-slate-100">
    {menuOpen && <button className="fixed inset-0 z-40 bg-black/65 lg:hidden" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-white/[0.08] bg-[#0a1725]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-6 pb-8 pt-7">
        <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/30 bg-emerald-300/[0.1] text-emerald-300 shadow-[0_0_25px_rgba(80,230,186,.1)]"><MapPinned size={21} strokeWidth={1.8} /></span>
          <span><span className="block text-[15px] font-extrabold tracking-tight text-white">TERRA<span className="text-emerald-300">METRIC</span></span><span className="block text-[10px] font-medium tracking-[0.23em] text-slate-500">SPATIAL INTELLIGENCE</span></span>
        </Link>
        <button className="p-2 text-slate-400 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>
      <div className="px-4"><p className="px-3 pb-3 text-[10px] font-bold tracking-[0.2em] text-slate-600">WORKSPACE</p>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'border border-emerald-300/15 bg-emerald-300/[0.1] text-emerald-200' : 'border border-transparent text-slate-400 hover:bg-white/[0.045] hover:text-white'}`}><Icon size={18} strokeWidth={1.8} />{label}</NavLink>)}
        </nav>
      </div>
      <div className="mt-9 px-4"><p className="px-3 pb-3 text-[10px] font-bold tracking-[0.2em] text-slate-600">RESOURCES</p>
        <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.045] hover:text-white"><span className="flex items-center gap-3"><Radio size={18} strokeWidth={1.8} /> API Docs</span><ArrowUpRight size={15} /></a>
      </div>
      <div className="mt-auto p-4"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
        <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-slate-500">SYSTEM STATUS</p>
        <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-semibold text-slate-200"><span className={`h-2 w-2 rounded-full ${health === 'online' ? 'bg-emerald-300 shadow-[0_0_12px_#6ee7b7]' : health === 'offline' ? 'bg-rose-400' : 'bg-slate-500 animate-pulse'}`} />Backend {health === 'online' ? 'online' : health === 'offline' ? 'offline' : 'checking'}</span><span className="font-mono text-[10px] text-slate-500">v1.0.0</span></div>
      </div><p className="px-2 pt-5 text-[10px] tracking-[0.08em] text-slate-600">GEOSPATIAL FILE MEASUREMENT API</p></div>
    </aside>

    <div className="lg:pl-[248px]"><header className="sticky top-0 z-30 flex min-h-[82px] items-center justify-between gap-4 border-b border-white/[0.07] bg-[#07131f]/85 px-5 backdrop-blur-xl sm:px-8 xl:px-10">
      <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-slate-300 hover:bg-white/[0.07] lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button><div><p className="text-[15px] font-bold text-white">{title}</p><p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p></div></div>
      <div className="flex items-center gap-3"><span className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:inline-flex ${health === 'online' ? 'border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200' : 'border-white/10 text-slate-400'}`}><span className={`h-1.5 w-1.5 rounded-full ${health === 'online' ? 'bg-emerald-300' : 'bg-slate-500'}`} />API {health === 'online' ? 'operational' : health === 'checking' ? 'checking' : 'offline'}</span><Link to="/upload" className="btn-primary !px-3.5 !py-2.5"><Plus size={15} /><span className="hidden sm:inline">New upload</span><span className="sm:hidden">Upload</span></Link></div>
    </header><main className="mx-auto max-w-[1580px] px-5 pb-14 pt-7 sm:px-8 xl:px-10 xl:pt-9"><Outlet /></main></div>
  </div>
}
