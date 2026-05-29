import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function LocationPicker({ onSelect, loca }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return; // init once

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json", // FREE tiles
      center: loca ? [loca.lng, loca.lat] : [-0.6348, 35.2016],
      zoom: loca ? 14 : 10,
    });

    mapRef.current = map;

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      // update parent
      onSelect({ lat, lng });

      // remove old marker
      if (markerRef.current) markerRef.current.remove();

      // add marker
      markerRef.current = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(map);
    });

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ height: "300px", width: "100%" }} />;
}
