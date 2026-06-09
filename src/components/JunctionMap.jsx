import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { JUNCTION } from '../lib/baseline';
import { PIN_COLORS } from '../lib/jcs';
import 'leaflet/dist/leaflet.css';

export default function JunctionMap({ junctions, onSelect }) {
  return (
    <MapContainer
      center={[JUNCTION.lat, JUNCTION.lng]}
      zoom={15}
      scrollWheelZoom
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {junctions.map((j) => (
        <CircleMarker
          key={j.id}
          center={[j.lat, j.lng]}
          radius={14}
          pathOptions={{
            color: '#fff',
            weight: 3,
            fillColor: PIN_COLORS[j.colorKey],
            fillOpacity: 0.9,
          }}
          eventHandlers={{ click: () => onSelect(j) }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="text-sm">
              <div className="font-semibold">{j.name}</div>
              <div>JCS: {j.jcsScore.toFixed(1)} / 10 — {j.statusLabel}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
