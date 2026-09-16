/**
 * MapPage — scaffold placeholder.
 *
 * This page will embed a Mapbox GL JS map for geospatial visualization
 * of project sites. Mapbox is intentionally NOT initialized here:
 *
 *   - No VITE_MAPBOX_TOKEN is set in this scaffold stage.
 *   - The mapbox-gl package is installed and ready.
 *   - Map initialization will be implemented in the geospatial stage.
 *
 * Do NOT add fake map data or mock coordinates to this component.
 */
function MapPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-semibold text-slate-100">Map</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Geospatial map view — requires Mapbox token (VITE_MAPBOX_TOKEN). To be implemented in
          geospatial stage.
        </p>
      </div>
      <div
        className="flex-1 flex items-center justify-center bg-slate-900 m-6 rounded-xl border border-slate-800"
        aria-label="Map placeholder"
        role="img"
      >
        <div className="text-center space-y-2">
          <div className="text-4xl">🗺️</div>
          <p className="text-slate-400 text-sm">Map will render here</p>
          <p className="text-slate-600 text-xs">Mapbox GL JS — pending token configuration</p>
        </div>
      </div>
    </div>
  )
}

export default MapPage
