import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";

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


function MapTapCloser({ closeFilters }) {
  useMapEvents({
    click: () => closeFilters?.(),
    dragstart: () => closeFilters?.(), // optional
  });
  return null;
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
    dragstart: () => onBackgroundClick?.(), // closes when user starts moving map
  });
  return null;
}

function LocateControl({ onLocated }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const control = L.control({ position: "bottomright" });

    control.onAdd = function () {
      const container = L.DomUtil.create("div", "leaflet-bar");
      container.style.background = "transparent";
      container.style.border = "none";
      container.style.boxShadow = "none";

      const btn = L.DomUtil.create("button", "", container);
      btn.type = "button";
      btn.title = "Center on my location";
      btn.setAttribute("aria-label", "Center on my location");

      btn.style.width = "36px";
      btn.style.height = "36px";
      btn.style.borderRadius = "9999px";
      btn.style.border = "1px solid rgba(0,0,0,0.12)";
      btn.style.background = "rgba(255,255,255,0.92)";
      btn.style.backdropFilter = "blur(8px)";
      btn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
      btn.style.cursor = "pointer";
      btn.style.display = "grid";
      btn.style.placeItems = "center";

      // ⬇️ This is the spacing ABOVE zoom. Smaller = closer to zoom.
      // Try 44px or 40px depending on device.
      btn.style.marginBottom = "32px";

      btn.textContent = "⌖";
      btn.style.fontSize = "18px";
      btn.style.lineHeight = "18px";
      btn.style.color = "#111827";

      L.DomEvent.disableClickPropagation(btn);
      L.DomEvent.on(btn, "click", (e) => {
        L.DomEvent.stopPropagation(e);

        if (!navigator.geolocation) {
          alert("Geolocation not supported on this device.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latitude = pos.coords.latitude;
            const longitude = pos.coords.longitude;

            onLocated?.({ lat: latitude, lon: longitude });

            map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
              animate: true,
              duration: 0.8,
            });
          },
          (err) => {
            alert(err?.message || "Could not get your location.");
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });

      return container;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map, onLocated]);

  return null;
}


function UserLocationMarker({ pos }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !pos) return;

    const icon = L.divIcon({
      className: "",
      html: `
        <div class="user-loc-wrap">
          <div class="user-loc-halo"></div>
          <div class="user-loc-dot"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([pos.lat, pos.lon], { icon, interactive: false }).addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, pos]);

  return null;
}



export default function Map({ locations, onSelect, selected, theme, onBackgroundClick, onMapReady }) {

  const isDark = theme === "dark";
  const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
  const styleId = isDark ? "mapbox/dark-v11" : "mapbox/streets-v12";
  // // Mapbox raster tiles from styles require tileSize=512 and zoomOffset=-1
  const tileUrl =
    `https://api.mapbox.com/styles/v1/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${token}`;

  const tileAttr =
    '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const [userPos, setUserPos] = useState(null);



  return (
    <MapContainer 
    center={[35.4676, -97.5164]} 
    zoom={13} 
    className="h-full w-full"
    zoomControl={false}
    whenCreated={(m) => onMapReady?.(m)}
    zoomAnimation={false}
    fadeAnimation={false}
    markerZoomAnimation={false}
    inertia={false}
    inertiaDeceleration={3000}
    inertiaMaxSpeed={1500}
    >
      {/* <TileLayer url={tileUrl} attribution={tileAttr} /> */}
      <TileLayer
        url={tileUrl}
        attribution={tileAttr}
        tileSize={512}
        zoomOffset={-1}
        maxZoom={20}
      />

      <FlyToSelected selected={selected} />
      <MapBackgroundClick onBackgroundClick={onBackgroundClick} />
      <ZoomControl position="bottomright" />
      <LocateControl onLocated={setUserPos} />
      <UserLocationMarker pos={userPos} />

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