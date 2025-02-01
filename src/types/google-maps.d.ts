declare namespace google.maps {
  class StreetViewPanorama {
    constructor(container: Element, options: StreetViewPanoramaOptions);
  }

  class StreetViewService {
    getPanorama(request: StreetViewLocationRequest): Promise<StreetViewResponse>;
  }

  interface StreetViewPanoramaOptions {
    position: { lat: number; lng: number };
    pov: { heading: number; pitch: number };
    zoom: number;
    addressControl?: boolean;
    showRoadLabels?: boolean;
  }

  interface StreetViewLocationRequest {
    location: { lat: number; lng: number };
    radius: number;
  }

  interface StreetViewResponse {
    data?: any;
  }
} 