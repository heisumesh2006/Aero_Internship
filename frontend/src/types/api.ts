import type { Geometry } from 'geojson'

export type FileStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type MeasurementStatus =
  | 'SUPPORTED'
  | 'NOT_REQUIRED'
  | 'UNSUPPORTED'
  | 'INVALID_GEOMETRY'
  | 'MEASUREMENT_FAILED'

