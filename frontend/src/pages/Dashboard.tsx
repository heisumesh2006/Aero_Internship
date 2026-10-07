import { useEffect, useState } from 'react'
import { Activity, ArrowRight, ArrowUpRight, FileStack, Layers3, MapPinned, Route, ScanLine, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorPanel, SectionHeading, Skeleton, StatusBadge } from '../components/ui'
import { getAllFiles, getMeasurements } from '../services/api'
import type { UploadedFile } from '../types/api'
import { crsDescription, featureCounts, formatDate } from '../utils/format'

interface DashboardData { files: UploadedFile[]; polygons: number | null; lines: number | null }

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setError('')
    getAllFiles().then(async files => {
      const completed = files.filter(file => file.status === 'COMPLETED')
      const counts = await Promise.allSettled(completed.map(file => getMeasurements(file.id)))
      const complete = counts.every(result => result.status === 'fulfilled')
      const totals = counts.reduce((sum, result) => {
        if (result.status === 'fulfilled') {
          const count = featureCounts(result.value.features)
          sum.polygons += count.polygons
          sum.lines += count.lines
        }
        return sum
      }, { polygons: 0, lines: 0 })
      if (active) setData({ files, polygons: complete ? totals.polygons : null, lines: complete ? totals.lines : null })
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load dashboard data.') })
    return () => { active = false }
  }, [reload])

  const latest = data?.files[0]
  const stats = [
    { label: 'Total files', value: data?.files.length, icon: FileStack, tint: 'text-emerald-300', glow: 'bg-emerald-300/10', caption: 'Processed datasets' },
    { label: 'Total features', value: data?.files.reduce((sum, file) => sum + file.feature_count, 0), icon: Layers3, tint: 'text-sky-300', glow: 'bg-sky-300/10', caption: 'Spatial records' },
    { label: 'Polygon features', value: data?.polygons, icon: ScanLine, tint: 'text-violet-300', glow: 'bg-violet-300/10', caption: 'Area measurements' },
    { label: 'Line features', value: data?.lines, icon: Route, tint: 'text-amber-300', glow: 'bg-amber-300/10', caption: 'Length measurements' },
  ]

  return <div className="space-y-8 animate-appear">
    <section className="panel hero-glow relative overflow-hidden p-7 sm:p-9 xl:min-h-[300px] xl:p-11">
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative z-10 grid gap-9 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div className="max-w-2xl"><p className="eyebrow mb-5 flex items-center gap-2"><Sparkles size={14} /> GEOSPATIAL WORKSPACE <span className="mx-1 text-emerald-300/40">/</span> OVERVIEW</p>
          <h1 className="max-w-[650px] text-3xl font-extrabold leading-[1.16] tracking-[-.045em] text-white sm:text-4xl xl:text-[44px]">Geospatial File <span className="text-emerald-300">Measurement</span></h1>
          <p className="mt-5 max-w-[600px] text-sm leading-7 text-slate-300 sm:text-[15px]">Upload KML or Shapefile data, inspect geometries, reproject coordinates, and calculate accurate spatial measurements.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3"><Link to="/upload" className="btn-primary">Upload dataset <ArrowRight size={17} /></Link><Link to="/files" className="btn-muted">Explore files <ArrowUpRight size={16} /></Link></div>
        </div>
        <div className="relative mx-auto hidden h-[215px] w-full max-w-[370px] lg:block" aria-hidden="true">
          <div className="absolute inset-3 rounded-full border border-emerald-200/10" /><div className="absolute inset-9 rounded-full border border-emerald-200/15" /><div className="absolute inset-[74px] rounded-full border border-emerald-200/20" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 370 215" fill="none"><path d="M26 163C76 91 94 135 137 81S216 135 272 61 325 54 354 31" stroke="#8BDEC0" strokeWidth="2" strokeDasharray="5 7" opacity=".55"/><path d="M42 48l44 20 30-38 41 31 38-17 53 41 35-27 54 47" stroke="#6DAAB7" strokeWidth="1" opacity=".24"/><circle cx="137" cy="81" r="5" fill="#91E7C3"/><circle cx="272" cy="61" r="5" fill="#91E7C3"/><circle cx="72" cy="112" r="3" fill="#78ADDF"/></svg>
          <div className="absolute left-8 top-7 rounded-xl border border-white/10 bg-[#0b1d2b]/90 px-3 py-2 shadow-xl"><span className="mono text-[10px] text-emerald-300">12.9716° N</span><span className="ml-2 mono text-[10px] text-slate-400">77.5946° E</span></div>
          <div className="absolute bottom-2 right-0 rounded-2xl border border-emerald-300/15 bg-[#102c34]/90 px-4 py-3 shadow-xl"><div className="flex items-center gap-2 text-xs font-bold text-white"><Activity size={14} className="text-emerald-300" /> Spatial analysis</div><p className="mono mt-1 text-[10px] text-emerald-200/65">SOURCE → UTM → METRIC</p></div>
        </div>
      </div>
    </section>

    {error && <ErrorPanel message={error} onRetry={() => setReload(value => value + 1)} />}

    <section aria-label="Workspace summary"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tint, glow, caption }) => <div className="panel panel-hover p-5 sm:p-6" key={label}>
        <div className="flex items-start justify-between"><span className="text-xs font-semibold text-slate-400">{label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${glow} ${tint}`}><Icon size={18} /></span></div>
        {data ? <p className="mt-4 text-[32px] font-extrabold leading-none tracking-tight text-white">{value == null ? '—' : value.toLocaleString()}</p> : <Skeleton className="mt-4 h-9 w-20" />}
        <p className="mt-3 text-[11px] text-slate-500">{value == null && data ? 'Unavailable for some files' : caption}</p>
      </div>)}
    </div></section>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(285px,.8fr)]">
      <section><SectionHeading eyebrow="YOUR DATA" title="Recent datasets" aside={<Link to="/files" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200">View all files <ArrowRight size={14} /></Link>} />
        {data && data.files.length === 0 ? <EmptyState title="Upload your first geospatial dataset to begin." description="Your processed KML and zipped Shapefile datasets will appear here." action="Upload dataset" href="/upload" /> : <div className="panel overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-white/[0.07] text-[10px] font-bold uppercase tracking-[.15em] text-slate-500"><th className="px-6 py-4">Dataset</th><th className="px-4 py-4">Features</th><th className="px-4 py-4">Source CRS</th><th className="px-4 py-4">Measurement CRS</th><th className="px-4 py-4">Status</th><th className="px-4 py-4" /></tr></thead>
            <tbody>{data ? data.files.slice(0, 5).map(file => <tr key={file.id} className="group border-b border-white/[0.055] last:border-0 hover:bg-white/[0.025]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-300/[0.08] text-sky-300"><MapPinned size={17} /></span><div className="min-w-0"><p className="max-w-[200px] truncate text-xs font-bold text-white">{file.filename}</p><p className="mt-0.5 text-[10px] text-slate-500">{file.file_type} · {formatDate(file.created_at)}</p></div></div></td><td className="mono px-4 py-4 text-xs text-slate-300">{file.feature_count}</td><td className="mono px-4 py-4 text-[11px] text-slate-400">{file.source_crs || '—'}</td><td className="mono px-4 py-4 text-[11px] text-emerald-200/80">{file.measurement_crs || '—'}</td><td className="px-4 py-4"><StatusBadge status={file.status} /></td><td className="px-4 py-4"><Link to={`/files/${file.id}`} aria-label={`Open ${file.filename}`} className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-emerald-300"><ArrowUpRight size={17} /></Link></td></tr>) : [1, 2, 3].map(index => <tr key={index}><td className="px-6 py-5" colSpan={6}><Skeleton className="h-8 w-full" /></td></tr>)}</tbody>
          </table></div>
        </div>}
      </section>
      <aside><SectionHeading eyebrow="LATEST ACTIVITY" title="Last processed" />
        <div className="panel relative min-h-[245px] overflow-hidden p-6"><div className="soft-grid absolute inset-0 opacity-30" />
          {latest ? <div className="relative"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><MapPinned size={22} /></span><StatusBadge status={latest.status} /></div><p className="mt-6 truncate text-lg font-bold text-white">{latest.filename}</p><p className="mt-1 text-xs text-slate-500">{latest.file_type} · {latest.feature_count} features · {formatDate(latest.created_at)}</p><div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-5"><div><p className="text-[10px] uppercase tracking-widest text-slate-500">Source</p><p className="mono mt-1 text-xs text-white">{latest.source_crs || '—'}</p><p className="mt-1 text-[10px] text-slate-500">{crsDescription(latest.source_crs)}</p></div><div><p className="text-[10px] uppercase tracking-widest text-slate-500">Measured in</p><p className="mono mt-1 text-xs text-emerald-200">{latest.measurement_crs || '—'}</p><p className="mt-1 text-[10px] text-slate-500">{crsDescription(latest.measurement_crs)}</p></div></div><Link to={`/files/${latest.id}`} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">Open dataset <ArrowRight size={13} /></Link></div> : data ? <div className="relative flex min-h-[195px] flex-col items-center justify-center text-center"><p className="text-sm font-semibold text-white">Nothing analyzed yet</p><p className="mt-2 text-xs text-slate-500">Upload a dataset to see its CRS and measurements here.</p></div> : <Skeleton className="relative h-44 w-full" />}
        </div>
      </aside>
    </div>
  </div>
}
