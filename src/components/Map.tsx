import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { WHISKIES } from "@/data/whiskies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const TOKEN_KEY = "mapbox_token";
const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!mapContainer.current || !token) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-4.2, 57.1],
      // Scotland
      zoom: 5.1,
      pitch: 0,
      attributionControl: true
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), "top-right");
    map.scrollZoom.disable();
    map.on("load", () => {
      // Note: Map functionality disabled since location coordinates were removed from the database
      // To re-enable: Add location coordinates back to the whisky database or update the schema
      setReady(true);
    });
    return () => map.remove();
  }, [token]);
  const tokenSaved = useMemo(() => Boolean(localStorage.getItem(TOKEN_KEY)), []);
  return <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Map of Japan — Discover the Set</CardTitle>
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