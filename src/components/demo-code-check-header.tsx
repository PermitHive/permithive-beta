"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Save, Edit } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface DemoCodeCheckHeaderProps {
  address: string;
  latitude: number;
  longitude: number;
}

export const DemoCodeCheckHeader: React.FC<DemoCodeCheckHeaderProps> = ({
  address,
  latitude,
  longitude,
}) => {
  console.log("Header received coords:", { latitude, longitude });
  const hasValidCoordinates = latitude !== 0 && longitude !== 0;
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('streets');

  useEffect(() => {
    if (!hasValidCoordinates) return;

    let panorama: google.maps.StreetViewPanorama | null = null;
    let isMounted = true;

    const initStreetView = async () => {
      try {
        await loadGoogleMaps();
        
        // Check if component is still mounted
        if (!isMounted) return;

        // Check if element still exists
        const streetViewElement = document.getElementById("street-view");
        if (!streetViewElement) return;

        panorama = new window.google.maps.StreetViewPanorama(
          streetViewElement,
          {
            position: { lat: latitude, lng: longitude },
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: false,
          }
        );

        const streetViewService = new window.google.maps.StreetViewService();
        try {
          await streetViewService.getPanorama({
            location: { lat: latitude, lng: longitude },
            radius: 50,
          });
          if (isMounted) {
            console.log("Street View available");
          }
        } catch (error) {
          if (isMounted) {
            console.error("Street View not available", error);
            if (streetViewElement) {
              streetViewElement.innerHTML = "Street View not available for this location";
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading Google Maps:", error);
        }
      }
    };

    initStreetView();

    return () => {
      isMounted = false;
      if (panorama) {
        const element = document.getElementById("street-view");
        if (element) {
          element.innerHTML = '';
        }
      }
    };
  }, [latitude, longitude, hasValidCoordinates]);

  useEffect(() => {
    if (!hasValidCoordinates || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    // Set access token before map initialization
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const loadStartTime = Date.now();
    let loadTimeout: NodeJS.Timeout | null = null;
    let map: mapboxgl.Map | null = null;

    try {
      map = new mapboxgl.Map({
        container: "map",
        style: mapStyle === 'satellite' 
          ? 'mapbox://styles/mapbox/satellite-v9'
          : 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 18,
        attributionControl: false,
      });

      // Add error handling
      map.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

      map.on('load', () => {
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
        toggleButton.textContent = newStyle === 'satellite' ? 'Map View' : 'Satellite View';
        
        // Update map style
        if (map) {
          const newStyleUrl = newStyle === 'satellite' 
            ? 'mapbox://styles/mapbox/satellite-v9'
            : 'mapbox://styles/mapbox/streets-v12';
          
          map.setStyle(newStyleUrl);

          // Re-add marker after style change
          map.once('style.load', () => {
            if (map) {
              new mapboxgl.Marker({
                color: "#64B6AC",
              })
                .setLngLat([longitude, latitude])
                .addTo(map);
            }
          });
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
    <div className="w-full bg-white">
      <div className="flex gap-6 p-6">
        {/* Left side - Street View (60%) */}
        <div className="w-[65%] h-96 bg-white rounded-lg overflow-hidden relative">
          <div id="street-view" className="w-full h-full bg-white" />

          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Address and coordinates container */}
          <div className="absolute bottom-4 left-4 text-white">
            <div className="text-lg font-medium drop-shadow-md">{address}</div>
            <div className="text-sm text-gray-200 font-mono">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Right side - Mapbox (40%) */}
        <div className="w-[35%] h-96 bg-white rounded-lg overflow-hidden">
          <div id="map" className="w-full h-full" style={{ backgroundColor: '#FFFFFF' }} />
        </div>
      </div>
    </div>
  );
};
