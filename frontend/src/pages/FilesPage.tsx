import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, FileStack, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorPanel, SectionHeading, Skeleton, StatusBadge } from '../components/ui'
import { getAllFiles } from '../services/api'
import type { UploadedFile } from '../types/api'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 8

export function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[] | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('ALL')
  const [page, setPage] = useState(0)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setError('')
    getAllFiles().then(items => { if (active) setFiles(items) }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load datasets.') })
    return () => { active = false }
  }, [reload])

  const filtered = useMemo(() => (files || []).filter(file => file.filename.toLowerCase().includes(query.toLowerCase()) && (type === 'ALL' || file.file_type === type)), [files, query, type])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const changeQuery = (value: string) => { setQuery(value); setPage(0) }
  const changeType = (value: string) => { setType(value); setPage(0) }

  return <div className="space-y-7 animate-appear">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-2">DATASET LIBRARY</p><h1 className="text-3xl font-extrabold tracking-tight text-white">All files</h1><p className="mt-2 text-sm text-slate-400">Browse every processed geospatial dataset and open its measurements.</p></div><span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300">{files?.length ?? '—'} datasets</span></div>
    {error && <ErrorPanel message={error} onRetry={() => setReload(value => value + 1)} />}
    {files && files.length === 0 ? <EmptyState title="No datasets uploaded yet." description="Upload a KML or zipped Shapefile to start building your dataset library." action="Upload dataset" href="/upload" /> : <section>
      <SectionHeading eyebrow="BROWSE & FILTER" title="Dataset inventory" aside={<span className="text-xs text-slate-500">{filtered.length} matching datasets</span>} />
      <div className="panel overflow-hidden"><div className="flex flex-wrap gap-3 border-b border-white/[0.07] p-4 sm:p-5"><label className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><span className="sr-only">Search by filename</span><input value={query} onChange={event => changeQuery(event.target.value)} className="field pl-10" placeholder="Search filenames..." /></label><label className="relative min-w-[170px]"><SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><span className="sr-only">Filter by file type</span><select value={type} onChange={event => changeType(event.target.value)} className="field appearance-none pl-10 pr-9"><option value="ALL">All formats</option><option value="KML">KML</option><option value="SHAPEFILE">Shapefile ZIP</option></select></label></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[890px] text-left"><thead><tr className="border-b border-white/[0.07] bg-white/[0.018] text-[10px] font-bold uppercase tracking-[.15em] text-slate-500"><th className="px-6 py-4">File</th><th className="px-4 py-4">Type</th><th className="px-4 py-4">Features</th><th className="px-4 py-4">Source CRS</th><th className="px-4 py-4">Measurement CRS</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Created</th><th className="px-4 py-4">View</th></tr></thead><tbody>
          {!files ? Array.from({ length: 4 }, (_, index) => <tr key={index}><td colSpan={8} className="px-6 py-5"><Skeleton className="h-9 w-full" /></td></tr>) : visible.map(file => <tr key={file.id} className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.025]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-300/[0.08] text-emerald-300"><FileStack size={17} /></span><span className="max-w-[190px] truncate text-xs font-bold text-white" title={file.filename}>{file.filename}</span></div></td><td className="px-4 py-4 text-xs text-slate-300">{file.file_type}</td><td className="mono px-4 py-4 text-xs text-slate-300">{file.feature_count}</td><td className="mono px-4 py-4 text-[11px] text-slate-400">{file.source_crs || '—'}</td><td className="mono px-4 py-4 text-[11px] text-emerald-200">{file.measurement_crs || '—'}</td><td className="px-4 py-4"><StatusBadge status={file.status} /></td><td className="px-4 py-4 text-xs text-slate-400">{formatDate(file.created_at)}</td><td className="px-4 py-4"><Link to={`/files/${file.id}`} aria-label={`View ${file.filename}`} className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-emerald-300"><ArrowUpRight size={17} /></Link></td></tr>)}
        </tbody></table></div>
        {files && filtered.length === 0 && <div className="px-6 py-16 text-center"><p className="text-sm font-bold text-white">No matching datasets</p><p className="mt-1 text-xs text-slate-500">Try another filename or format filter.</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4"><span className="text-xs text-slate-500">Showing {filtered.length ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button disabled={page === 0} onClick={() => setPage(value => value - 1)} className="btn-muted !px-3 !py-2 disabled:opacity-35" aria-label="Previous page"><ArrowLeft size={15} /></button><span className="mono px-2 text-xs text-slate-300">{page + 1} / {pageCount}</span><button disabled={page >= pageCount - 1} onClick={() => setPage(value => value + 1)} className="btn-muted !px-3 !py-2 disabled:opacity-35" aria-label="Next page"><ArrowRight size={15} /></button></div></div>
      </div>
    </section>}
  </div>
}
