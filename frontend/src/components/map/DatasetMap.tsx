import { useEffect, useMemo, useState } from 'react'
import * as L from 'leaflet'
import { Crosshair, Globe2, LocateFixed } from 'lucide-react'
import { GeoJSON, MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import type { Feature as GeoFeature } from 'geojson'
import type { FeatureMeasurement } from '../../types/api'
import { formatMeasurement, geometryFamily } from '../../utils/format'

function colorFor(type: string | null) {
  const family = geometryFamily(type)
  return family === 'Point' ? '#9de9d0' : family === 'Line' ? '#67c9ee' : family === 'Polygon' ? '#c4a7f3' : '#e5b870'
}

function MapActions({ features, selected, fitKey, globalKey }: { features: FeatureMeasurement[]; selected: FeatureMeasurement | null; fitKey: number; globalKey: number }) {
  const map = useMap()
  const mapped = useMemo(() => features.filter(feature => feature.geometry).map(feature => ({ type: 'Feature', properties: { index: feature.feature_index }, geometry: feature.geometry } as GeoFeature)), [features])

  useEffect(() => {
    map.invalidateSize()
    if (!mapped.length) return
    const bounds = L.geoJSON(mapped).getBounds()
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.28), { maxZoom: 15, animate: false })
  }, [map, mapped, fitKey])

  useEffect(() => {
    if (!selected?.geometry) return
    const bounds = L.geoJSON(selected.geometry).getBounds()
    if (!bounds.isValid()) return
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.flyTo(bounds.getCenter(), 15, { duration: 0.55 })
    else map.flyToBounds(bounds.pad(0.7), { maxZoom: 15, duration: 0.55 })
  }, [map, selected])

  useEffect(() => { if (globalKey) map.setView([20, 0], 2, { animate: true }) }, [globalKey, map])
  return null
}

export function DatasetMap({ features, selectedIndex, onSelect }: { features: FeatureMeasurement[]; selectedIndex: number | null; onSelect: (index: number) => void }) {
  const [fitKey, setFitKey] = useState(0)
  const [globalKey, setGlobalKey] = useState(0)
  const selected = features.find(feature => feature.feature_index === selectedIndex) || null
  const mapped = features.filter(feature => feature.geometry)

  return <div id="map" className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6"><div><p className="eyebrow mb-1">SPATIAL CANVAS</p><h2 className="text-base font-bold text-white">Geometry map</h2></div><div className="flex gap-2"><button onClick={() => setFitKey(value => value + 1)} className="btn-muted !px-3 !py-2 text-xs" aria-label="Fit map to dataset"><LocateFixed size={15} /> Fit to data</button><button onClick={() => setGlobalKey(value => value + 1)} className="btn-muted !px-3 !py-2 text-xs" aria-label="Reset map to global view"><Globe2 size={15} /><span className="hidden sm:inline">Reset view</span></button></div></div>
    <div className="map-surface relative h-[390px] sm:h-[470px] xl:h-[520px]">
      <MapContainer center={[12.9716, 77.5946]} zoom={11} minZoom={2} scrollWheelZoom className="h-full w-full" zoomControl={false} aria-label="Interactive dataset map">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomright" />
        <MapActions features={features} selected={selected} fitKey={fitKey} globalKey={globalKey} />
        {mapped.map(feature => {
          const active = feature.feature_index === selectedIndex
          const color = colorFor(feature.geometry_type)
          const data: GeoFeature = { type: 'Feature', properties: { index: feature.feature_index }, geometry: feature.geometry! }
          return <GeoJSON key={`${feature.feature_index}-${active}`} data={data} style={() => ({ color, fillColor: color, weight: active ? 5 : 3, opacity: 1, fillOpacity: active ? 0.42 : 0.2 })} pointToLayer={(_, latLng) => L.circleMarker(latLng, { radius: active ? 10 : 7, color: '#092129', weight: 2, fillColor: color, fillOpacity: 1 })} eventHandlers={{ click: () => onSelect(feature.feature_index) }} onEachFeature={(_, layer) => {
            layer.bindTooltip(`#${feature.feature_index + 1} · ${feature.geometry_type || 'Geometry'} · ${formatMeasurement(feature.measurement)}`, { sticky: true, direction: 'top' })
          }} />
        })}
      </MapContainer>
      {!mapped.length && <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-[#081925]/75"><div className="rounded-2xl border border-white/10 bg-[#102434] p-6 text-center"><Crosshair size={24} className="mx-auto text-emerald-300" /><p className="mt-3 text-sm font-bold text-white">No map geometry available</p><p className="mt-1 text-xs text-slate-400">Features without valid geometry still appear in the list.</p></div></div>}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex gap-3 rounded-xl border border-white/10 bg-[#081925]/90 px-3 py-2 text-[10px] font-semibold text-slate-300 shadow-lg sm:gap-4 sm:px-4"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#9de9d0]" /> Point</span><span className="flex items-center gap-1.5"><span className="h-[3px] w-3 rounded bg-[#67c9ee]" /> Line</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#c4a7f3]" /> Polygon</span></div>
    </div>
  </div>
}
