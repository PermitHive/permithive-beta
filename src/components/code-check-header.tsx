"use client";

import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Save, Edit } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface CodeCheckHeaderProps {
  address: string;
  latitude: number;
  longitude: number;
}

export const CodeCheckHeader: React.FC<CodeCheckHeaderProps> = ({
  address,
  latitude,
  longitude,
}) => {
  console.log("CodeCheckHeader props:", { address, latitude, longitude });
  console.log("Header received coords:", { latitude, longitude });
  const hasValidCoordinates = latitude !== 0 && longitude !== 0;
  const [mapStyle, setMapStyle] = React.useState<'satellite' | 'streets'>('satellite');
  const [streetViewError, setStreetViewError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!hasValidCoordinates) return;

    let panorama: google.maps.StreetViewPanorama | null = null;
    let isMounted = true;

    const initStreetView = async () => {
      try {
        await loadGoogleMaps();
        
        const streetViewElement = document.getElementById("street-view");
        if (!streetViewElement || !isMounted) return;

        const service = new google.maps.StreetViewService();
        const response = await service.getPanorama({
          location: { lat: latitude, lng: longitude },
          radius: 50
        });

        if (!isMounted) return;

        if (response && response.data) {
          // Initialize Street View
          const panorama = new google.maps.StreetViewPanorama(streetViewElement, {
            position: { lat: latitude, lng: longitude },
            pov: { heading: 34, pitch: 10 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: false
          });

          // Add error handling for panorama
          // if (panorama) {
          //   google.maps.event.addListener(panorama, 'status_changed', () => {
          //     if (!panorama?.getLinks()?.length) {
          //       setStreetViewError("Street View not available for this location");
          //     }
          //   });
          // }

        }

      } catch (error) {
        if (isMounted) {
          console.error("Street View error:", error);
          setStreetViewError("Street View not available for this location");
        }
      }
    };

    initStreetView();

    return () => {
      isMounted = false;
      if (panorama) {
        // Clean up panorama instance
        const element = document.getElementById("street-view");
        if (element) {
          element.innerHTML = '';
        }
      }
    };
  }, [latitude, longitude, hasValidCoordinates]);

  useEffect(() => {
    console.log("Mapbox token:", !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
    if (!hasValidCoordinates || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    let map: mapboxgl.Map | null = null;
    const loadStartTime = Date.now();
    let loadTimeout: NodeJS.Timeout | null = null;

    try {
      // Set access token before map initialization
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

      map = new mapboxgl.Map({
        container: "map",
        style: mapStyle === 'satellite' 
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 16
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

      map.on('load', () => {
        console.log('Mapbox loaded successfully');
        const loadTime = Date.now() - loadStartTime;
        
        const completeLoad = () => {
          if (map) {
            new mapboxgl.Marker({
              color: "#64B6AC",
            })
              .setLngLat([longitude, latitude])
              .addTo(map);
          }
        };

        if (loadTime > 100) { // If load time > 0.1s
          loadTimeout = setTimeout(() => {
            completeLoad();
          }, Math.max(0, 500 - loadTime)); // Ensure total time is at least 0.5s
        } else {
          completeLoad();
        }
      });

      // Add map style toggle control
      const toggleButton = document.createElement('button');
      toggleButton.className = 'absolute top-2 right-2 bg-white px-3 py-1.5 rounded-md shadow-md text-sm font-medium hover:bg-gray-50 transition-colors z-10';
      toggleButton.textContent = mapStyle === 'satellite' ? 'Map View' : 'Satellite View';
      toggleButton.onclick = () => {
        const newStyle = mapStyle === 'satellite' ? 'streets' : 'satellite';
        setMapStyle(newStyle);
        if (map) {
          map.setStyle(newStyle === 'satellite' 
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : 'mapbox://styles/mapbox/streets-v12'
          );
        }
      };
      document.getElementById('map')?.appendChild(toggleButton);

      return () => {
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
        if (map) {
          map.remove();
        }
        toggleButton.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      return () => {
        if (loadTimeout) {
          clearTimeout(loadTimeout);
        }
        if (map) {
          map.remove();
        }
      };
    }
  }, [latitude, longitude, mapStyle]);

  return (
    <>
      {/* <div className="w-full h-[4rem] bg-white border-b fixed top-0 z-10" /> */}
      <nav className="sticky top-[4rem] z-20 py-4 border-b bg-white rounded-b-lg">
        <div className="flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-medium">{address}</div>
              {hasValidCoordinates && (
                <div className="text-sm text-gray-500 font-mono">
                  {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                </div>
              )}
            </div>
          </div>
          {/* <div className="space-x-4">
            <Button variant="outline" onClick={() => {}}>
              Analyze Documents
            </Button>
            <Button variant="outline">Save as PDF</Button>
            <Button variant="outline" href="https://www.google.com">
              Share
            </Button>
            <Button variant="outline">Edit Details</Button>
          </div> */}
        </div>
      </nav>
      <div className="w-full flex gap-6 mt-6">
        {/* Left side - Street View (60%) */}
        <div className="w-[65%] h-96 bg-gray-100 rounded-lg overflow-hidden relative">
          <div id="street-view" className="w-full h-full">
            {streetViewError && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                {streetViewError}
              </div>
            )}
          </div>
          
          {/* Make sure the address overlay is OUTSIDE the street-view div */}
          {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 text-white z-10">
            <div className="text-lg font-medium drop-shadow-md">{address}</div>
            {hasValidCoordinates && (
              <div className="text-sm text-gray-200 font-mono">
                {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
              </div>
            )}
          </div> */}
        </div>

        {/* Right side - Mapbox (40%) */}
        <div className="w-[35%] h-96 rounded-lg overflow-hidden">
          {hasValidCoordinates && process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
            <div id="map" className="w-full h-full" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              {!hasValidCoordinates ? "Invalid coordinates" : "Loading map..."}
            </div>
          )}
        </div>
      </div>
    </>
  );
};