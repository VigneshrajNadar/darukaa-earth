import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import type { Map } from 'mapbox-gl'

interface MapboxDrawControlProps {
  map: Map | null
  onDrawCreate: (e: any) => void
  onDrawUpdate: (e: any) => void
  onDrawDelete: (e: any) => void
  onModeChange: (e: any) => void
}

export interface MapboxDrawHandle {
  startPolygon: () => void
  clear: () => void
}

export const MapboxDrawControl = forwardRef<MapboxDrawHandle, MapboxDrawControlProps>(
  function MapboxDrawControl({ map, onDrawCreate, onDrawUpdate, onDrawDelete, onModeChange }, ref) {
    const drawRef = useRef<MapboxDraw | null>(null)
    const handlersRef = useRef({ onDrawCreate, onDrawUpdate, onDrawDelete, onModeChange })

    useEffect(() => {
      handlersRef.current = { onDrawCreate, onDrawUpdate, onDrawDelete, onModeChange }
    }, [onDrawCreate, onDrawUpdate, onDrawDelete, onModeChange])

    useImperativeHandle(
      ref,
      () => ({
        startPolygon: () => drawRef.current?.changeMode('draw_polygon'),
        clear: () => drawRef.current?.deleteAll(),
      }),
      []
    )

    useEffect(() => {
      if (!map) return

      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      })

      map.addControl(drawRef.current, 'top-right')

      const handleCreate = (event: unknown) => handlersRef.current.onDrawCreate(event)
      const handleUpdate = (event: unknown) => handlersRef.current.onDrawUpdate(event)
      const handleDelete = (event: unknown) => handlersRef.current.onDrawDelete(event)
      const handleModeChange = (event: unknown) => handlersRef.current.onModeChange(event)

      map.on('draw.create', handleCreate)
      map.on('draw.update', handleUpdate)
      map.on('draw.delete', handleDelete)
      map.on('draw.modechange', handleModeChange)

      return () => {
        const removed = (map as Map & { _removed?: boolean })._removed
        if (!removed) {
          map.off('draw.create', handleCreate)
          map.off('draw.update', handleUpdate)
          map.off('draw.delete', handleDelete)
          map.off('draw.modechange', handleModeChange)
          if (drawRef.current) map.removeControl(drawRef.current)
        }
        drawRef.current = null
      }
    }, [map]) // Intentionally omit handlers to avoid recreating Mapbox Draw instance repeatedly

    return null
  }
)

MapboxDrawControl.displayName = 'MapboxDrawControl'
