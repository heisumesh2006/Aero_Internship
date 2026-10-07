import type { ReactNode } from 'react'
import { AlertCircle, ArrowRight, DatabaseZap, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FileStatus, MeasurementStatus } from '../types/api'

export function StatusBadge({ status }: { status: FileStatus | MeasurementStatus }) {
  const tone = status === 'COMPLETED' || status === 'SUPPORTED'
    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
    : status === 'PROCESSING'
      ? 'border-sky-400/25 bg-sky-400/10 text-sky-200'
      : status === 'NOT_REQUIRED'
        ? 'border-slate-400/25 bg-slate-400/10 text-slate-300'
        : 'border-amber-400/25 bg-amber-400/10 text-amber-200'
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.13em] ${tone}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{status.replaceAll('_', ' ')}
  </span>
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.08] px-5 py-4 text-rose-100">
    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
    <div className="min-w-0 flex-1"><p className="font-semibold">Something went wrong</p><p className="mt-1 text-sm leading-6 text-rose-100/75">{message}</p></div>
    {onRetry && <button onClick={onRetry} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-200 hover:bg-rose-300/10">Retry</button>}
  </div>
}

export function EmptyState({ title, description, action, href }: { title: string; description: string; action?: string; href?: string }) {
  return <div className="panel flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
    <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-300"><DatabaseZap size={24} /></span>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
    {action && href && <Link className="btn-primary mt-6" to={href}>{action}<ArrowRight size={16} /></Link>}
  </div>
}

export function LoadingState({ label = 'Loading geospatial data' }: { label?: string }) {
  return <div className="panel flex min-h-[260px] flex-col items-center justify-center gap-4" role="status">
    <LoaderCircle className="h-7 w-7 animate-spin text-emerald-300" />
    <span className="text-sm text-slate-400">{label}</span>
  </div>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.065] ${className}`} aria-hidden="true" />
}

export function SectionHeading({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2></div>
    {aside}
  </div>
}
