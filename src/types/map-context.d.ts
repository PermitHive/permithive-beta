import type { Map as MapboxMap } from '@mapbox/react-map-gl';

declare module 'react-map-gl' {
  export interface MapContextValue<MapInstance = MapboxMap> {
    map?: MapInstance | null;
    mapRef?: React.RefObject<MapInstance> | null;
  }

  export const MapContext: ReturnType<typeof import('react').createContext<MapContextValue<MapboxMap> | null>>;
  
  export * from 'react-map-gl/src/components/map';
}