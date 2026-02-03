import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '../../context/GameContext';
import { CITIES } from '../../data/cities';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet generic marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const truckIcon = new L.DivIcon({
    className: 'custom-truck-icon',
    html: `<div style="
    background-color: #3b82f6; 
    width: 14px; 
    height: 14px; 
    border-radius: 50%; 
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
  "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const truckIconEmpty = new L.DivIcon({
    className: 'custom-truck-icon-empty',
    html: `<div style="
    background-color: #eab308; 
    width: 14px; 
    height: 14px; 
    border-radius: 50%; 
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(234, 179, 8, 0.6);
  "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const cityIcon = new L.DivIcon({
    className: 'custom-city-icon',
    html: `<div style="background-color: #f8fafc; width: 8px; height: 8px; border-radius: 50%; border: 1px solid #94a3b8;"></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4]
});

const hqIcon = new L.DivIcon({
    className: 'custom-hq-icon',
    html: `<div style="
    background-color: #3b82f6; 
    width: 24px; 
    height: 24px; 
    border-radius: 6px; 
    border: 2px solid white;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

export const MapView: React.FC = () => {
    const { state } = useGame();
    const { trucks } = state;

    return (
        <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundColor: '#0f172a' }}>
            <MapContainer
                center={[50.0, 10.0]}
                zoom={4}
                style={{ height: '100%', width: '100%', background: '#0f172a' }}
                attributionControl={false}
                zoomControl={false}
                minZoom={4}
                maxBounds={[[30, -20], [72, 45]]} // Europe + North Africa bounds
                maxBoundsViscosity={1.0}
            >
                <TileLayer
                    // Dark Matter style tiles for "premium" look
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Cities */}
                {CITIES.map(city => (
                    <Marker key={city.id} position={[city.coordinates.lat, city.coordinates.lng]} icon={cityIcon}>
                        <Popup className="glass-popup">
                            <strong className="text-slate-900">{city.name}</strong>
                        </Popup>
                    </Marker>
                ))}

                {/* Trucks */}
                {trucks.map(truck => (
                    <React.Fragment key={truck.id}>
                        <Marker
                            position={[truck.location.lat, truck.location.lng]}
                            icon={truck.status === 'MOVING_TO_SOURCE' ? truckIconEmpty : truckIcon}
                        >
                            <Popup className="glass-popup">
                                <div className="p-2">
                                    <h3 className="font-bold text-slate-800">{truck.name}</h3>
                                    <p className="text-xs text-slate-600">{truck.status}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Route Line if moving */}
                        {(truck.status === 'MOVING' || truck.status === 'MOVING_TO_SOURCE') && truck.routePath && (
                            <Polyline
                                positions={truck.routePath.map(c => [c.lat, c.lng])}
                                pathOptions={{
                                    color: truck.status === 'MOVING' ? '#3b82f6' : '#eab308',
                                    weight: 3,
                                    opacity: 0.7
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}

                {/* HQ Marker */}
                {(() => {
                    const hqCity = CITIES.find(c => state.game.hqLocation.startsWith(c.name));
                    if (!hqCity) return null;
                    return (
                        <Marker position={[hqCity.coordinates.lat, hqCity.coordinates.lng]} icon={hqIcon} zIndexOffset={1000}>
                            <Popup className="glass-popup">
                                <div className="p-2">
                                    <h3 className="font-bold text-slate-800">Company HQ</h3>
                                    <p className="text-xs text-slate-600">{hqCity.name}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })()}

            </MapContainer>
        </div>
    );
};
