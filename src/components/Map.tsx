import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type WhiskyLocation = {
  id: string;
  distillery: string;
  name: string;
  region: string | null;
  location?: string | null;
};

// Mapping of Japanese regions/locations to coordinates
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // Hokkaido
  "Hokkaido": [143.2085, 43.2203],
  "Sapporo": [141.3469, 43.0642],
  
  // Honshu regions
  "Miyagi": [141.1355, 38.7222],
  "Sendai": [140.8694, 38.2682],
  "Yamanashi": [138.5684, 35.6938],
  "Nagano": [138.1815, 36.7014],
  "Shizuoka": [138.3837, 34.9756],
  "Gifu": [137.2112, 35.3912],
  "Osaka": [135.5023, 34.6937],
  "Kyoto": [135.7681, 35.0116],
  "Hyogo": [135.1832, 34.6913],
  
  // Kyushu
  "Kagoshima": [130.5581, 31.5966],
  "Kumamoto": [130.7417, 32.7503],
  "Miyazaki": [131.4202, 31.9077],
  
  // Default Japan center for unknown locations
  "Japan": [138.2529, 36.2048]
};

const TOKEN_KEY = "mapbox_token";

interface MapProps {
  whiskies?: WhiskyLocation[];
}

const Map: React.FC<MapProps> = ({ whiskies = [] }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !token) return;
    
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [138.2529, 36.2048], // Japan center
      zoom: 5.5,
      pitch: 0,
      attributionControl: true
    });
    
    mapRef.current = map;
    
    map.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), "top-right");
    
    map.scrollZoom.disable();
    
    map.on("load", () => {
      setReady(true);
    });
    
    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.remove();
    };
  }, [token]);

  // Add whisky markers when map is ready and whiskies data is available
  useEffect(() => {
    if (!ready || !mapRef.current || !whiskies.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    whiskies.forEach(whisky => {
      const location = whisky.location || whisky.region || "Japan";
      const coordinates = LOCATION_COORDINATES[location] || LOCATION_COORDINATES["Japan"];
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'whisky-marker';
      markerEl.style.cssText = `
        width: 12px;
        height: 12px;
        background: hsl(var(--primary));
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 15 })
          .setHTML(`
            <div style="padding: 8px; font-size: 14px;">
              <strong>${whisky.distillery}</strong><br>
              <em>${whisky.name}</em><br>
              <small style="color: #666;">${whisky.region || location}</small>
            </div>
          `))
        .addTo(mapRef.current);
        
      markersRef.current.push(marker);
    });
  }, [ready, whiskies]);
  const tokenSaved = useMemo(() => Boolean(localStorage.getItem(TOKEN_KEY)), []);
  return <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Map of Japan — Discover Your Whiskies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token && <div className="space-y-2 text-sm text-muted-foreground">
            <p>Enter your Mapbox public token to enable the interactive map. You can find it in your Mapbox dashboard under Tokens.</p>
            <div className="flex gap-2 max-w-xl">
              <Input placeholder="pk.eyJ... your Mapbox public token" value={token} onChange={e => setToken(e.target.value)} aria-label="Mapbox public token" />
              <Button onClick={() => {
            if (token) {
              localStorage.setItem(TOKEN_KEY, token);
              // Trigger map init
              setToken(token);
            }
          }}>Save</Button>
            </div>
          </div>}

        <div className="relative w-full h-[420px] rounded-lg overflow-hidden border">
          <div ref={mapContainer} className="absolute inset-0" />
          {!ready && token && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Loading map…</div>}
        </div>
      </CardContent>
    </Card>;
};
export default Map;