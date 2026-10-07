import type { FeatureMeasurement, MeasurementResponse } from '../types/api'

export type GeometryFamily = 'Point' | 'Line' | 'Polygon' | 'Other'

export function geometryFamily(type: string | null): GeometryFamily {
  if (type?.includes('Point')) return 'Point'
  if (type?.includes('Line')) return 'Line'
  if (type?.includes('Polygon')) return 'Polygon'
  return 'Other'
}

