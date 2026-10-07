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

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function crsDescription(crs: string | null): string {
  if (!crs) return 'Not available'
  if (crs === 'EPSG:4326') return 'Geographic coordinates'
  const match = /^EPSG:(326|327)(\d{2})$/.exec(crs)
  if (match) return `UTM Zone ${Number(match[2])}${match[1] === '326' ? 'N' : 'S'} · metric projection`
  return 'Projected coordinate system'
}

export function featureCounts(features: FeatureMeasurement[]) {
  return {
    measurable: features.filter(item => item.measurement.status === 'SUPPORTED').length,
    polygons: features.filter(item => geometryFamily(item.geometry_type) === 'Polygon').length,
    lines: features.filter(item => geometryFamily(item.geometry_type) === 'Line').length,
    points: features.filter(item => geometryFamily(item.geometry_type) === 'Point').length,
  }
}
