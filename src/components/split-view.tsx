"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface SplitViewMapProps extends React.HTMLAttributes<HTMLDivElement> {
  address: string;
  center: [number, number];
}

export default function SplitViewMap({
  address,
  center,
  className,
  ...props
}: SplitViewMapProps) {
  const streetMapContainer = React.useRef<HTMLDivElement>(null);
  const aerialMapContainer = React.useRef<HTMLDivElement>(null);
  const streetMap = React.useRef<mapboxgl.Map | null>(null);
  const aerialMap = React.useRef<mapboxgl.Map | null>(null);

  React.useEffect(() => {
    if (!streetMapContainer.current || !aerialMapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    if (!mapboxgl.accessToken) {
      console.error("Mapbox access token is required");
      return;
    }

    // Initialize street view map
    streetMap.current = new mapboxgl.Map({
      container: streetMapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: 17,
      pitch: 45,
      bearing: 0,
    });

    // Initialize aerial view map
    aerialMap.current = new mapboxgl.Map({
      container: aerialMapContainer.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: center,
      zoom: 16,
      pitch: 0,
      bearing: 0,
    });

    // Add markers
    new mapboxgl.Marker().setLngLat(center).addTo(streetMap.current);

    new mapboxgl.Marker().setLngLat(center).addTo(aerialMap.current);

    // Cleanup
    return () => {
      streetMap.current?.remove();
      aerialMap.current?.remove();
    };
  }, [center]);

  return (
    <div className="flex flex-col md:flex-row w-full h-[500px]" {...props}>
      {/* Street View (60%) */}
      <div className="w-full md:w-[60%] h-1/2 md:h-full relative">
        <div ref={streetMapContainer} className="absolute inset-0" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.4) 100%)",
          }}
        />
        <div className="absolute bottom-4 left-4 text-left">
          <h2 className="text-xl font-semibold text-white drop-shadow-md">
            {address}
          </h2>
        </div>
      </div>

      {/* Aerial View (40%) */}
      <div className="w-full md:w-[40%] h-1/2 md:h-full relative">
        <div ref={aerialMapContainer} className="absolute inset-0" />
      </div>
    </div>
  );
}
