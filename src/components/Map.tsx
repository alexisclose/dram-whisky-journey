import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

type WhiskyLocation = {
  id: string;
  distillery: string;
  name: string;
  region: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// Comprehensive mapping of distillery regions/locations to coordinates
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // Japan - Hokkaido
  "Hokkaido": [143.2085, 43.2203],
  "Sapporo": [141.3469, 43.0642],
  
  // Japan - Honshu regions
  "Miyagi": [141.1355, 38.7222],
  "Sendai": [140.8694, 38.2682],
  "Yamanashi": [138.5684, 35.6938],
  "Nagano": [138.1815, 36.7014],
  "Shizuoka": [138.3837, 34.9756],
  "Gifu": [137.2112, 35.3912],
  "Osaka": [135.5023, 34.6937],
  "Kyoto": [135.7681, 35.0116],
  "Hyogo": [135.1832, 34.6913],
  
  // Japan - Kyushu
  "Kagoshima": [130.5581, 31.5966],
  "Kumamoto": [130.7417, 32.7503],
  "Miyazaki": [131.4202, 31.9077],
  
  // Scotland - Whisky Regions
  "Speyside": [-3.2765, 57.5040],
  "Highlands": [-4.2026, 57.4778],
  "Islay": [-6.1967, 55.7558],
  "Campbeltown": [-5.6058, 55.4242],
  "Lowlands": [-3.9680, 55.5344],
  "Islands": [-6.2301, 57.2785],
  "Scotland": [-4.2026, 56.4907],
  
  // Ireland
  "Cork": [-8.4863, 51.8979],
  "Dublin": [-6.2603, 53.3498],
  "Midleton": [-8.1795, 51.9157],
  "Belfast": [-5.9301, 54.5973],
  "Ireland": [-8.2439, 53.4129],
  
  // United States
  "Kentucky": [-84.8630, 37.8393],
  "Tennessee": [-86.7816, 35.7656],
  "Indiana": [-86.1349, 39.7910],
  "Virginia": [-78.1694, 37.7693],
  "New York": [-74.0060, 40.7128],
  "California": [-119.4179, 36.7783],
  "Colorado": [-105.7821, 39.5501],
  "Texas": [-97.5164, 31.0545],
  "United States": [-95.7129, 37.0902],
  
  // Canada
  "Ontario": [-85.3232, 51.2538],
  "Alberta": [-113.4909, 53.9333],
  "British Columbia": [-127.6476, 53.7267],
  "Nova Scotia": [-63.7443, 44.6820],
  "Canada": [-106.3468, 56.1304],
  
  // Default centers
  "Japan": [138.2529, 36.2048],
  "World": [0, 20]
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
  const [loadingToken, setLoadingToken] = useState(false);
  const { session } = useAuthSession();

  // Calculate map bounds and center based on whisky locations
  const mapConfig = useMemo(() => {
    if (!whiskies.length) return { center: [0, 20] as [number, number], zoom: 2, title: "World Map" };

    // Get unique countries from whiskies
    const countries = new Set<string>();
    const regions = new Set<string>();

    whiskies.forEach(whisky => {
      // Use precise coordinates if available
      if (whisky.latitude && whisky.longitude) return;
      
      const location = whisky.location || whisky.region || "";
      
      // Determine country based on region patterns
      if (location.includes("Hokkaido") || location.includes("Honshu") || location.includes("Kyushu") || 
          location.includes("Miyagi") || location.includes("Yamanashi") || location.includes("Nagano") ||
          location.includes("Shizuoka") || location.includes("Gifu") || location.includes("Osaka") || 
          location.includes("Kyoto") || location.includes("Hyogo") || location.includes("Kagoshima") ||
          location.includes("Kumamoto") || location.includes("Miyazaki")) {
        countries.add("Japan");
        regions.add(location);
      } else if (location.includes("Speyside") || location.includes("Highland") || location.includes("Islay") || 
                 location.includes("Campbeltown") || location.includes("Lowland") || location.includes("Islands") ||
                 location.includes("Scotland")) {
        countries.add("Scotland");
        regions.add(location);
      } else if (location.includes("Ireland") || location.includes("Cork") || location.includes("Dublin") ||
                 location.includes("Midleton") || location.includes("Belfast")) {
        countries.add("Ireland");
        regions.add(location);
      } else if (location.includes("Kentucky") || location.includes("Tennessee") || location.includes("Indiana") ||
                 location.includes("Virginia") || location.includes("New York") || location.includes("California") ||
                 location.includes("Colorado") || location.includes("Texas") || location.includes("United States")) {
        countries.add("United States");
        regions.add(location);
      }
    });

    // Determine title and center based on countries
    const countriesArray = Array.from(countries);
    if (countriesArray.length === 1) {
      const country = countriesArray[0];
      const coords = LOCATION_COORDINATES[country] || LOCATION_COORDINATES["World"];
      let zoom = 5.5;
      
      if (country === "Scotland") zoom = 6.5;
      else if (country === "Ireland") zoom = 6.5;
      else if (country === "United States") zoom = 4;
      
      return {
        center: coords as [number, number],
        zoom,
        title: `${country} Whisky Map`
      };
    } else if (countriesArray.length > 1) {
      return {
        center: LOCATION_COORDINATES["World"] as [number, number],
        zoom: 2,
        title: "International Whisky Map"
      };
    }

    return { center: LOCATION_COORDINATES["World"] as [number, number], zoom: 2, title: "Whisky Map" };
  }, [whiskies]);

  // Fetch Mapbox token from Supabase
  const fetchMapboxToken = async () => {
    if (!session) return;
    
    setLoadingToken(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch (error) {
      console.error('Failed to fetch Mapbox token:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  // Auto-fetch token if user is logged in and no token exists
  useEffect(() => {
    if (session && !token && !loadingToken) {
      fetchMapboxToken();
    }
  }, [session, token, loadingToken]);

  useEffect(() => {
    if (!mapContainer.current || !token) return;
    
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: mapConfig.center,
      zoom: mapConfig.zoom,
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
  }, [token, mapConfig]);

  // Add whisky markers when map is ready and whiskies data is available
  useEffect(() => {
    if (!ready || !mapRef.current || !whiskies.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    whiskies.forEach(whisky => {
      let coordinates: [number, number];
      
      // Use precise coordinates if available
      if (whisky.latitude && whisky.longitude) {
        coordinates = [whisky.longitude, whisky.latitude];
      } else {
        // Fallback to region-based coordinates
        const location = whisky.location || whisky.region || "World";
        coordinates = LOCATION_COORDINATES[location] || LOCATION_COORDINATES["World"];
      }
      
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
        transition: transform 0.2s ease;
      `;
      
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.2)';
      });
      
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
      });
      
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 15 })
          .setHTML(`
            <div style="padding: 8px; font-size: 14px;">
              <strong>${whisky.distillery}</strong><br>
              <em>${whisky.name}</em><br>
              <small style="color: #666;">${whisky.region || whisky.location || 'Unknown'}</small>
            </div>
          `))
        .addTo(mapRef.current);
        
      markersRef.current.push(marker);
    });
  }, [ready, whiskies]);
  const tokenSaved = useMemo(() => Boolean(localStorage.getItem(TOKEN_KEY)), []);
  
  return <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{mapConfig.title} — Discover Your Whiskies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token && !session && <div className="space-y-2 text-sm text-muted-foreground">
            <p>Please log in to view the interactive map, or enter your Mapbox public token manually.</p>
          </div>}
        
        {!token && session && !loadingToken && <div className="space-y-2 text-sm text-muted-foreground">
            <p>Map temporarily unavailable. Enter your Mapbox public token to enable the interactive map.</p>
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
          
        {loadingToken && <div className="text-sm text-muted-foreground">Loading map...</div>}

        <div className="relative w-full h-[420px] rounded-lg overflow-hidden border">
          <div ref={mapContainer} className="absolute inset-0" />
          {!ready && token && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Loading map…</div>}
        </div>
      </CardContent>
    </Card>;
};
export default Map;