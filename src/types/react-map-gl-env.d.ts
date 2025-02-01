declare module 'react-map-gl' {
    import type { Map as MapboxMap } from 'mapbox-gl';
    import type { Context } from 'react';
  
    export interface MapContextValue<MapInstance = MapboxMap> {
      map?: MapInstance | null;
      mapRef?: React.RefObject<MapInstance> | null;
    }
  
    export const MapContext: Context<any>;
  
    export * from '@original/react-map-gl';
  }