import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { ArrowRight, Check, CheckCircle2, CloudUpload, FileArchive, FileCode2, Layers3, LoaderCircle, MapPinned, RotateCcw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorPanel, StatusBadge } from '../components/ui'
import { uploadFile } from '../services/api'
import type { UploadedFile } from '../types/api'
import { crsDescription, formatFileSize } from '../utils/format'

const MAX_SIZE = 25 * 1024 * 1024

export function UploadPage() {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const [result, setResult] = useState<UploadedFile | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function selectFile(file?: File) {
    if (!file) return
    setResult(null)
    if (!/\.(kml|zip)$/i.test(file.name)) {
      setSelected(null)
      setError('Unsupported file type. Upload a .kml file or a zipped Shapefile.')
    } else if (file.size === 0) {
      setSelected(null)
      setError('This file is empty. Choose a valid KML or zipped Shapefile.')
    } else if (file.size > MAX_SIZE) {
      setSelected(null)
      setError('The uploaded file exceeds the maximum allowed size of 25 MB.')
    } else {
      setSelected(file)
      setError('')
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) { selectFile(event.target.files?.[0]) }
  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragging(false)
    selectFile(event.dataTransfer.files[0])
  }
  function reset() {
    setSelected(null)
    setResult(null)
    setError('')
    if (input.current) input.current.value = ''
  }
  async function submit() {
    if (!selected) return
    setBusy(true)
    setError('')
    try { setResult(await uploadFile(selected)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Processing failed. Please try again or inspect the API response.') }
    finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-[1120px] space-y-8 animate-appear">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-2">INGEST GEOSPATIAL DATA</p><h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[36px]">Upload a dataset</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Turn spatial files into measurable, explorable features in one step.</p></div><div className="mono rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-[11px] text-slate-400">MAX FILE SIZE <span className="text-emerald-300">25 MB</span></div></div>

    {result ? <section className="panel relative overflow-hidden p-7 sm:p-9"><div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-300/[0.07] blur-[80px]" /><div className="relative"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.1] text-emerald-300"><CheckCircle2 size={28} /></span><p className="eyebrow mt-7">UPLOAD COMPLETE</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">Your dataset is ready to explore.</h2><p className="mt-2 text-sm text-slate-400">Feature geometry and measurement metadata were saved successfully.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
        ['Filename', result.filename], ['Status', <StatusBadge status={result.status} />], ['Features', result.feature_count.toString()],
        ['Source CRS', result.source_crs || '—'], ['Measurement CRS', result.measurement_crs || '—'], ['File type', result.file_type],
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p><div className="mt-2 break-words text-sm font-bold text-white">{value}</div></div>)}</div>
      <div className="mt-6 rounded-xl border border-sky-300/15 bg-sky-300/[0.04] px-4 py-3 text-xs leading-6 text-slate-300"><span className="font-bold text-sky-200">CRS transformation:</span> {result.source_crs} ({crsDescription(result.source_crs)}) → {result.measurement_crs} ({crsDescription(result.measurement_crs)}). Source geometries remain unchanged.</div>
      <div className="mt-7 flex flex-wrap gap-3"><Link className="btn-primary" to={`/files/${result.id}#features`}>View measurements <ArrowRight size={16} /></Link><Link className="btn-muted" to={`/files/${result.id}#map`}>Open on map <MapPinned size={16} /></Link><button className="btn-muted" onClick={reset}><RotateCcw size={15} /> Upload another</button></div>
    </div></section> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.8fr)]">
      <section className="panel p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow mb-1">NEW DATASET</p><h2 className="text-lg font-bold text-white">Choose a spatial file</h2></div><CloudUpload className="text-emerald-300" size={23} /></div>
        <input ref={input} type="file" accept=".kml,.zip" className="sr-only" onChange={onInputChange} aria-label="Choose KML or zipped Shapefile" />
        <div role="button" tabIndex={busy ? -1 : 0} aria-label="Drop a KML or zipped Shapefile here, or browse files" onClick={() => !busy && input.current?.click()} onKeyDown={event => { if ((event.key === 'Enter' || event.key === ' ') && !busy) { event.preventDefault(); input.current?.click() } }} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`soft-grid group flex min-h-[270px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-6 text-center transition-all duration-200 ${dragging ? 'scale-[1.01] border-emerald-300 bg-emerald-300/[0.09]' : 'border-emerald-300/20 bg-[#0b1b29]/65 hover:border-emerald-300/50 hover:bg-emerald-300/[0.035]'} ${busy ? 'pointer-events-none opacity-55' : ''}`}>
          <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.1] text-emerald-300 transition group-hover:-translate-y-1"><CloudUpload size={28} strokeWidth={1.6} /></span><p className="text-base font-bold text-white">Drag & drop your file here</p><p className="mt-2 text-xs text-slate-400">or <span className="font-bold text-emerald-300">browse files</span> on your device</p><p className="mt-5 max-w-sm text-[11px] leading-5 text-slate-500">Upload a KML file or a ZIP containing .shp, .shx, .dbf and optionally .prj</p>
        </div>
        {selected && <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.055] p-3.5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">{selected.name.toLowerCase().endsWith('.zip') ? <FileArchive size={21} /> : <FileCode2 size={21} />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white" title={selected.name}>{selected.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{selected.name.split('.').pop()?.toUpperCase()} · {formatFileSize(selected.size)}</p></div><button disabled={busy} onClick={reset} aria-label="Remove selected file" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><Trash2 size={17} /></button></div>}
        {error && <div className="mt-5"><ErrorPanel message={error} /></div>}
        {busy && <div className="mt-5 flex items-center gap-3 rounded-xl border border-sky-300/20 bg-sky-300/[0.06] px-4 py-3" role="status"><LoaderCircle size={19} className="animate-spin text-sky-300" /><div><p className="text-sm font-bold text-white">Processing on server</p><p className="mt-0.5 text-xs text-slate-400">Validating, reading features, selecting CRS, and measuring geometry. This may take a moment.</p></div></div>}
        <button className="btn-primary mt-6 w-full !py-3.5" disabled={!selected || busy} onClick={submit}>{busy ? <><LoaderCircle size={17} className="animate-spin" /> Processing dataset…</> : <>Upload & process <ArrowRight size={17} /></>}</button>
      </section>

      <aside className="space-y-5"><div className="panel p-6"><p className="eyebrow mb-4">SUPPORTED FORMATS</p><div className="space-y-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-300/10 text-sky-300"><FileCode2 size={20} /></span><div><p className="text-sm font-bold text-white">KML</p><p className="mt-1 text-xs leading-5 text-slate-400">Keyhole Markup Language. Best for placemarks, routes, and areas.</p></div></div><div className="h-px bg-white/[0.07]" /><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-violet-300"><FileArchive size={20} /></span><div><p className="text-sm font-bold text-white">Shapefile ZIP</p><p className="mt-1 text-xs leading-5 text-slate-400">A single dataset containing .shp, .shx, .dbf, and preferably .prj.</p></div></div></div></div>
        <div className="panel p-6"><p className="eyebrow mb-4">WHAT HAPPENS NEXT</p><div className="space-y-4">{[['01', 'Parse features'], ['02', 'Detect source CRS'], ['03', 'Select metric projection'], ['04', 'Calculate measurements'], ['05', 'Store & visualize']].map(([step, label]) => <div key={step} className="flex items-center gap-3"><span className="mono text-[11px] text-emerald-300/80">{step}</span><span className="h-px w-4 bg-emerald-300/20" /><span className="text-xs font-semibold text-slate-300">{label}</span><Check size={13} className="ml-auto text-emerald-300/50" /></div>)}</div></div>
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] px-5 py-4"><div className="flex gap-3"><Layers3 className="mt-0.5 shrink-0 text-emerald-300" size={18} /><div><p className="text-xs font-bold text-emerald-200">Precision by projection</p><p className="mt-1 text-[11px] leading-5 text-slate-400">Coordinates in degrees are transformed to a suitable UTM projection before measuring areas and lengths.</p></div></div></div>
      </aside>
    </div>}
  </div>
}
