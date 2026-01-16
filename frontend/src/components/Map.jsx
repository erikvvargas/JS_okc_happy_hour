import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect } from "react";

// Fix default Leaflet marker icons (important)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function iconForStatus(status) {
  const cls =
    status === "ACTIVE"
      ? "hh-pin hh-pin-active"
      : status === "UPCOMING"
      ? "hh-pin hh-pin-upcoming"
      : "hh-pin hh-pin-inactive";

  return L.divIcon({
    className: "", // important: prevents default styles
    html: `<div class="${cls}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}



function FlyToSelected({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    const lat = Number(selected.lat);
    const lon = Number(selected.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
  }, [selected, map]);

  return null;
}

function MapBackgroundClick({ onBackgroundClick }) {
  useMapEvents({
    click: () => onBackgroundClick?.(),
  });
  return null;
}

export default function Map({ locations, onSelect, selected, theme, onBackgroundClick }) {
  const isDark = theme === "dark";

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const tileAttr =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <MapContainer 
    center={[35.4676, -97.5164]} 
    zoom={13} 
    className="h-full w-full"
    zoomControl={false}>
      <TileLayer url={tileUrl} attribution={tileAttr} />

      <FlyToSelected selected={selected} />
      <MapBackgroundClick onBackgroundClick={onBackgroundClick} />
      <ZoomControl position="bottomright" />

      <MarkerClusterGroup chunkedLoading>
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[Number(loc.lat), Number(loc.lon)]}
            icon={iconForStatus(loc._status)}
            eventHandlers={{
              click: (e) => {
                e?.originalEvent?.stopPropagation?.();
                onSelect?.(loc);
              },
            }}
          />

        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}