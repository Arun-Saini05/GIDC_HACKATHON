
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// ── FlyToSearchTarget — defined OUTSIDE MapComponent so React never remounts it ──
const FlyToSearchTarget = ({ target, geoData }) => {
    const map = useMap();
    const highlightRef = useRef(null);

    useEffect(() => {
        if (!target || !geoData) return;

        let cancelled = false;

        // Remove previous highlight immediately
        if (highlightRef.current) {
            map.removeLayer(highlightRef.current);
            highlightRef.current = null;
        }

        if (target.type === 'state') {
            fetch(`http://192.168.0.102:8001/api/state-boundary/${encodeURIComponent(target.name)}`)
                .then(r => r.json())
                .then(dissolved => {
                    if (cancelled) return;  // effect was cleaned up — discard stale response
                    if (dissolved.error || !dissolved.features) return;
                    const layer = L.geoJSON(dissolved, {
                        style: {
                            color: '#FFFFFF',
                            weight: 3.5,
                            opacity: 1,
                            fillOpacity: 0,
                            dashArray: '',
                        }
                    }).addTo(map);
                    highlightRef.current = layer;
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 7, duration: 1.2 });
                    }
                })
                .catch(() => { });

        } else if (target.type === 'district') {
            const matched = geoData.features.filter(f =>
                (f.properties.district_std || '').toUpperCase() === target.name.toUpperCase()
            );
            if (!matched.length) return;
            const layer = L.geoJSON(
                { type: 'FeatureCollection', features: matched },
                {
                    style: {
                        color: '#FFFFFF',
                        weight: 4,
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.25,
                        dashArray: '',
                    }
                }
            ).addTo(map);
            highlightRef.current = layer;
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 9, duration: 1.2 });
            }
        }

        return () => {
            cancelled = true;  // cancel any in-flight fetch
            if (highlightRef.current) {
                map.removeLayer(highlightRef.current);
                highlightRef.current = null;
            }
        };
    }, [target]);

    return null;
};
// ─────────────────────────────────────────────────────────────────────────────

const MapComponent = ({ routePath, setHoveredDistrict, searchTarget, showRoads }) => {
    const [geoData, setGeoData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [routeCoords, setRouteCoords] = useState([]);
    const [activeIncidents, setActiveIncidents] = useState([]);
    const [clickedDistrict, setClickedDistrict] = useState(null);

    useEffect(() => {
        if (!routePath || !geoData) return;

        const coords = [];
        routePath.forEach(stop => {
            const districtName = stop.name;
            const feature = geoData.features.find(f =>
                (f.properties.district_std || f.properties.district || '').toUpperCase().trim() === districtName.toUpperCase().trim()
            );

            if (feature) {
                const layer = L.geoJSON(feature);
                const center = layer.getBounds().getCenter();
                coords.push([center.lat, center.lng]);
            }
        });

        setRouteCoords(coords);
    }, [routePath, geoData]);

    useEffect(() => {
        // Fetch GeoJSON from backend with cache busting (V3)
        const timestamp = new Date().getTime();
        axios.get(`http://192.168.0.102:8001/api/districts_v3?t=${timestamp}`)
            .then(res => {
                if (res.data.error) {
                    console.error("Backend Error:", res.data.error);
                } else {
                    console.log("GeoJSON loaded:", res.data);
                    if (res.data.features && res.data.features.length > 0) {
                        console.log("Sample Feature Props:", res.data.features[0].properties);
                    }
                    setGeoData(res.data);
                }
            })
            .catch(err => console.error("Error loading map data:", err));
    }, []);

    // ── Fetch Real-time Incidents ──
    useEffect(() => {
        const fetchIncidents = () => {
            axios.get('http://192.168.0.102:8001/api/realtime-crimes')
                .then(res => {
                    if (res.data && res.data.incidents) {
                        setActiveIncidents(res.data.incidents);
                    }
                })
                .catch(err => console.error("Error fetching real-time incidents:", err));
        };
        fetchIncidents();
        const intervalId = setInterval(fetchIncidents, 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, []);
    // ───────────────────────────────

    const style = (feature) => {
        const hotspot = feature.properties.Hotspot_Category;
        // const isPredicted = feature.properties.Predicted_Future_Hotspot_LSTM; // Not in current export

        let fillColor = '#3B82F6'; // Default Blue
        if (hotspot === 'High') fillColor = '#EF4444'; // Red
        else if (hotspot === 'Medium') fillColor = '#F59E0B'; // Orange
        else if (hotspot === 'Low') fillColor = '#10B981'; // Green
        else if (hotspot === 'No Data') fillColor = '#64748B'; // Slate

        return {
            fillColor: fillColor,
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.6
        };
    };

    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 3,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.8
                });

                // Update Sidebar or Tooltip state
                setHoveredDistrict({
                    name: feature.properties.district_std || feature.properties.district || "Unknown District",
                    wci: feature.properties.WCI || 0,
                    category: feature.properties.Hotspot_Category || "No Data",
                    futureChance: feature.properties.Future_Increase_Chance || "N/A",
                    date: feature.properties.Analysis_Date || new Date().toLocaleDateString(),
                    // Road crime data
                    roadCrimeCategory: feature.properties.Road_Crime_Category || "No Data",
                    roadCrimeScore: feature.properties.Road_Crime_Score || 0,
                    rashDriving: feature.properties.incidence_of_rash_driving || 0,
                    motorVehicle: feature.properties.motor_vehicle_act || 0,
                    deathByNegligence: feature.properties.causing_death_by_negligence || 0,
                    robbery: feature.properties.robbery || 0,
                    // Total crimes + road-crime-specific YoY trend
                    totalCrimes: feature.properties.Total_Crimes || 0,
                    roadCrimeTrend: feature.properties.Road_Crime_Future_Trend || null,
                    // Women crime data
                    womenCrimeCategory: feature.properties.Women_Crime_Category || "No Data",
                    womenCrimeScore: feature.properties.Women_Crime_Score || 0,
                    womenCrimeTrend: feature.properties.Women_Crime_Future_Trend || null,
                });
            },
            mouseout: (e) => {
                const layer = e.target;
                // layer.resetStyle(e.target); // Requires saving ref to geojson, simpler to just set back approx
                // Actually resetStyle is best but let's manual for now
                layer.setStyle(style(feature));
                setHoveredDistrict(null);
            },
            click: (e) => {
                const props = feature.properties;
                setClickedDistrict({
                    name: props.district_std || props.district || "Unknown",
                    date: props.Analysis_Date || new Date().toISOString().split('.')[0].replace('T', ' '),
                    risk: props.Hotspot_Category || "No Data",
                    trend: props.Future_Increase_Chance || "N/A",
                    wci: props.WCI || 0,
                    latlng: e.latlng
                });
            }
        });
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="h-full w-full z-0">
            <MapContainer key="map-container-v1" center={[22.5937, 78.9629]} zoom={5} scrollWheelZoom={true} className="h-full w-full" zoomControl={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme base map
                />

                {/* Roadway Overlay */}
                {showRoads && (
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        opacity={0.35} // Slight transparency so dark map and crime colors still show through
                        className="map-tiles-roads-only"
                    />
                )}

                {geoData && (
                    <GeoJSON
                        key="crime-districts-v3"
                        data={geoData}
                        style={style}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Search zoom + highlight */}
                {geoData && searchTarget && (
                    <FlyToSearchTarget target={searchTarget} geoData={geoData} />
                )}

                {/* Route Visualization */}
                {routeCoords.length > 0 && (
                    <>
                        <Polyline
                            positions={routeCoords}
                            pathOptions={{ color: '#60A5FA', weight: 4, opacity: 0.8, dashArray: '5, 10' }}
                        />
                        {/* Start Marker */}
                        <Marker position={routeCoords[0]}>
                            <Popup>Start</Popup>
                        </Marker>
                        {/* End Marker */}
                        <Marker position={routeCoords[routeCoords.length - 1]}>
                            <Popup>Destination</Popup>
                        </Marker>
                    </>
                )}

                {/* Real-time Incident Markers */}
                {activeIncidents.map(inc => {
                    if (!inc.lat || !inc.lng) return null;
                    const pulsingIcon = L.divIcon({
                        className: 'bg-transparent border-none outline-none',
                        html: '<div class="realtime-incident-marker"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    return (
                        <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={pulsingIcon}>
                            <Popup className="realtime-popup">
                                <div className="p-1">
                                    <div className="font-bold text-red-600 uppercase text-xs mb-1">🚨 Live Alert</div>
                                    <div className="font-bold text-sm mb-1">{inc.crime_type} reporting in {inc.district}</div>
                                    <div className="text-xs italic text-gray-600 border-l-2 border-red-300 pl-2 my-2">
                                        "{inc.source_text}"
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-2">
                                        Detected via X at {new Date(inc.time).toLocaleTimeString()}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                {clickedDistrict && (
                    <Popup 
                        position={clickedDistrict.latlng}
                        onClose={() => setClickedDistrict(null)}
                        className="custom-district-popup"
                    >
                        <div className="bg-white p-2.5 rounded-xl shadow-2xl text-slate-900 border-none min-w-[140px] max-w-[180px]">
                            <h3 className="font-bold text-[12px] uppercase tracking-tight mb-0.5 text-slate-800 leading-none">{clickedDistrict.name}</h3>
                            <p className="text-[8px] text-slate-400 mb-2 border-b border-slate-100 pb-1">Date: {clickedDistrict.date}</p>
                            
                            <div className="space-y-1 text-[10px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Risk:</span>
                                    <span className={`font-black tracking-tight ${clickedDistrict.risk === 'High' ? 'text-red-500' : clickedDistrict.risk === 'Medium' ? 'text-orange-400' : 'text-green-500'}`}>
                                        {clickedDistrict.risk.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Trend:</span>
                                    <span className={`font-black tracking-tight ${clickedDistrict.trend && !clickedDistrict.trend.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                                        {clickedDistrict.trend}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-500/10">
                                    <span className="text-slate-500 font-bold">WCI:</span>
                                    <span className="font-black text-slate-700">{Number(clickedDistrict.wci).toFixed(3)}</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
