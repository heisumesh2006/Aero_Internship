import type { FeatureMeasurement, MeasurementResponse } from '../types/api'

export type GeometryFamily = 'Point' | 'Line' | 'Polygon' | 'Other'

export function geometryFamily(type: string | null): GeometryFamily {
  if (type?.includes('Point')) return 'Point'
  if (type?.includes('Line')) return 'Line'
  if (type?.includes('Polygon')) return 'Polygon'
  return 'Other'
}

export function formatMeasurement(measurement: MeasurementResponse): string {
  if (measurement.status === 'NOT_REQUIRED') return 'No measurement required'
  if (measurement.status === 'UNSUPPORTED') return 'Unsupported geometry'
  if (measurement.status === 'INVALID_GEOMETRY') return 'Invalid geometry'
  if (measurement.status === 'MEASUREMENT_FAILED') return 'Measurement unavailable'
  if (measurement.value == null) return '—'
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 3, minimumFractionDigits: 0 }).format(measurement.value)} ${measurement.unit || ''}`.trim()
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

