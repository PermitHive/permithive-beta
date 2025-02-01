declare module '@mapbox/react-map-gl' {
  import { Component, ReactNode } from 'react';
  
  export interface MapProps {
    initialViewState?: {
      longitude: number;
      latitude: number;
      zoom: number;
    };
    style?: any;
    mapStyle?: string;
    mapboxAccessToken?: string;
    children?: ReactNode;
  }

  export interface MarkerProps {
    longitude: number;
    latitude: number;
  }

  export class Marker extends Component<MarkerProps> {}
  
  export default class Map extends Component<MapProps> {}
} 