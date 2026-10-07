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

