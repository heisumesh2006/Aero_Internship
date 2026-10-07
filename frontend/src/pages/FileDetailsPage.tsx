import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, Compass, FileArchive, FileCode2, Layers3, MapPinned, MousePointer2, Route, ScanLine, Target } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { DatasetMap } from '../components/map/DatasetMap'
import { ErrorPanel, LoadingState, StatusBadge } from '../components/ui'
import { getFile, getMeasurements } from '../services/api'
import type { FeatureMeasurement, FileMeasurementsResponse, UploadedFile } from '../types/api'
import { crsDescription, featureCounts, formatDate, formatMeasurement, geometryFamily } from '../utils/format'

function GeometryMark({ type }: { type: string | null }) {
  const family = geometryFamily(type)
  return <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${family === 'Point' ? 'bg-emerald-300/10 text-emerald-300' : family === 'Line' ? 'bg-sky-300/10 text-sky-300' : family === 'Polygon' ? 'bg-violet-300/10 text-violet-300' : 'bg-amber-300/10 text-amber-300'}`}>{family === 'Point' ? <MapPinned size={19} /> : family === 'Line' ? <Route size={19} /> : family === 'Polygon' ? <ScanLine size={19} /> : <Target size={19} />}</span>
}

function propertyText(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function FeatureDetails({ feature }: { feature: FeatureMeasurement | null }) {
  if (!feature) return <div className="panel flex min-h-[220px] flex-col items-center justify-center px-5 text-center"><MousePointer2 className="text-emerald-300/65" size={26} /><h3 className="mt-4 text-sm font-bold text-white">Select a feature to inspect</h3><p className="mt-1 text-xs leading-5 text-slate-500">Choose a geometry on the map or from the feature list.</p></div>
  const entries = Object.entries(feature.properties).filter(([, value]) => value !== null && value !== '')
  return <section className="panel overflow-hidden"><div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4"><GeometryMark type={feature.geometry_type} /><div className="min-w-0 flex-1"><p className="eyebrow">SELECTED FEATURE #{feature.feature_index + 1}</p><h3 className="mt-1 truncate text-base font-bold text-white">{feature.geometry_type || 'Unknown geometry'}</h3></div><StatusBadge status={feature.measurement.status} /></div>
    <div className="space-y-5 p-5"><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{feature.measurement.type || 'Measurement'}</p><p className="mt-2 text-xl font-extrabold text-white">{formatMeasurement(feature.measurement)}</p>{feature.measurement.message && <p className="mt-1 text-xs leading-5 text-slate-400">{feature.measurement.message}</p>}</div>
      <div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] uppercase tracking-widest text-slate-500">Source CRS</p><p className="mono mt-1 text-xs text-white">{feature.source_crs}</p></div><div><p className="text-[10px] uppercase tracking-widest text-slate-500">Measurement CRS</p><p className="mono mt-1 text-xs text-emerald-200">{feature.measurement_crs || '—'}</p></div></div>
      <div><p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Properties</p>{entries.length ? <div className="overflow-hidden rounded-xl border border-white/[0.07]">{entries.map(([key, value]) => <div key={key} className="grid grid-cols-[minmax(90px,.7fr)_minmax(0,1.3fr)] gap-3 border-b border-white/[0.06] px-3 py-2.5 text-[11px] last:border-0"><span className="truncate text-slate-500" title={key}>{key}</span><span className="break-words text-slate-200">{propertyText(value)}</span></div>)}</div> : <p className="text-xs text-slate-500">No properties available.</p>}</div>
      <details className="group rounded-xl border border-white/[0.08] bg-white/[0.025]"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-slate-300">Raw geometry (GeoJSON)<ChevronDown size={15} className="transition group-open:rotate-180" /></summary><pre className="max-h-52 overflow-auto border-t border-white/[0.07] p-4 text-[10px] leading-5 text-emerald-100/75 mono">{feature.geometry ? JSON.stringify(feature.geometry, null, 2) : 'null'}</pre></details>
    </div>
  </section>
}

export function FileDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [measurements, setMeasurements] = useState<FileMeasurementsResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setError('')
    setFile(null)
    setMeasurements(null)
    setSelectedIndex(null)
    Promise.all([getFile(id, controller.signal), getMeasurements(id, controller.signal)]).then(([record, result]) => {
      setFile(record)
      setMeasurements(result)
    }).catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load dataset.') })
    return () => controller.abort()
  }, [id, reload])

  if (error) return <div className="space-y-6"><Link to="/files" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"><ArrowLeft size={14} /> Back to files</Link><ErrorPanel message={error} onRetry={() => setReload(value => value + 1)} /></div>
  if (!file || !measurements) return <LoadingState label="Loading geometries and measurements…" />

  const features = measurements.features
  const counts = featureCounts(features)
  const selected = features.find(feature => feature.feature_index === selectedIndex) || null
  const summary = [
    { label: 'Total features', value: features.length, icon: Layers3, color: 'text-white' },
    { label: 'Measurable', value: counts.measurable, icon: Target, color: 'text-emerald-300' },
    { label: 'Polygons', value: counts.polygons, icon: ScanLine, color: 'text-violet-300' },
    { label: 'Lines', value: counts.lines, icon: Route, color: 'text-sky-300' },
    { label: 'Points', value: counts.points, icon: MapPinned, color: 'text-amber-300' },
  ]

  return <div className="space-y-7 animate-appear"><div><Link to="/files" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-300"><ArrowLeft size={13} /> Back to library</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-300">{file.file_type === 'KML' ? <FileCode2 size={22} /> : <FileArchive size={22} />}</span><div className="min-w-0"><p className="eyebrow mb-1">DATASET EXPLORER / {file.file_type}</p><h1 className="break-all text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{file.filename}</h1><p className="mt-2 text-xs text-slate-500">Uploaded {formatDate(file.created_at)} <span className="mx-2 text-slate-700">·</span> ID <span className="mono text-slate-400">{file.id.slice(0, 8)}…</span></p></div></div><StatusBadge status={file.status} /></div></div>

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Feature summary">{summary.map(({ label, value, icon: Icon, color }) => <div className="panel flex items-center gap-3 p-4" key={label}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] ${color}`}><Icon size={17} /></span><div><p className="text-[10px] text-slate-500">{label}</p><p className="mt-0.5 text-xl font-extrabold leading-none text-white">{value}</p></div></div>)}</section>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.8fr)]"><div className="space-y-6"><DatasetMap features={features} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      <section className="panel p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-300/10 text-sky-300"><Compass size={20} /></span><div><p className="eyebrow mb-1">COORDINATE REFERENCE SYSTEMS</p><h2 className="text-base font-bold text-white">From coordinates to accurate measurements</h2></div></div><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Source CRS</p><p className="mono mt-2 text-base font-bold text-white">{file.source_crs || '—'}</p><p className="mt-1 text-xs text-slate-400">{crsDescription(file.source_crs)}</p></div><div className="hidden items-center text-emerald-300 sm:flex"><ArrowRight size={20} /></div><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Measurement CRS</p><p className="mono mt-2 text-base font-bold text-emerald-200">{file.measurement_crs || '—'}</p><p className="mt-1 text-xs text-slate-400">{crsDescription(file.measurement_crs)}</p></div></div><p className="mt-4 text-[11px] leading-5 text-slate-500">Measurements are calculated after projecting geographic coordinates into a metric CRS. The map shows original source-coordinate geometry.</p></section>
      <section className="panel px-5 py-5 sm:px-6"><p className="eyebrow mb-4">PROCESSING PIPELINE</p><div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-xs font-semibold text-slate-300">{['Upload', 'Parse', 'Detect CRS', 'Reproject', 'Measure', 'Store'].map((label, index) => <span className="flex items-center gap-2" key={label}><span className="rounded-lg border border-white/[0.09] bg-white/[0.04] px-2.5 py-1.5">{label}</span>{index < 5 && <ArrowRight size={12} className="text-emerald-300/60" />}</span>)}</div></section>
    </div>
      <aside className="space-y-5"><section id="features" className="panel overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><p className="eyebrow mb-1">FEATURES / {features.length.toString().padStart(2, '0')}</p><h2 className="text-base font-bold text-white">Spatial records</h2><p className="mt-1 text-[11px] text-slate-500">Select a feature to focus its geometry on the map.</p></div>{features.length ? <div className="max-h-[490px] space-y-2 overflow-y-auto p-3">{features.map(feature => <button key={feature.feature_index} onClick={() => setSelectedIndex(feature.feature_index)} aria-pressed={selectedIndex === feature.feature_index} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${selectedIndex === feature.feature_index ? 'border-emerald-300/40 bg-emerald-300/[0.09]' : 'border-transparent bg-white/[0.027] hover:border-white/[0.12] hover:bg-white/[0.055]'}`}><GeometryMark type={feature.geometry_type} /><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white">{feature.geometry_type || 'Unknown geometry'} <span className="font-normal text-slate-500">#{feature.feature_index + 1}</span></p><p className="mt-1 truncate text-[11px] text-slate-400">{formatMeasurement(feature.measurement)}</p></div><span className={`h-2 w-2 shrink-0 rounded-full ${feature.measurement.status === 'SUPPORTED' ? 'bg-emerald-300' : feature.measurement.status === 'NOT_REQUIRED' ? 'bg-slate-500' : 'bg-amber-300'}`} /></button>)}</div> : <div className="px-5 py-12 text-center text-sm text-slate-500">No features available.</div>}</section><FeatureDetails feature={selected} /></aside>
    </div>
  </div>
}
