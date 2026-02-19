
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, Marker, Popup, useMap } from 'react-leaflet';
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

const MapComponent = ({ routePath, setHoveredDistrict }) => {
    const [geoData, setGeoData] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [routeCoords, setRouteCoords] = useState([]);

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
        axios.get(`http://localhost:8000/api/districts_v3?t=${timestamp}`)
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
                    date: feature.properties.Analysis_Date || new Date().toLocaleDateString()
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
                // Select district logic
            }
        });
    };

    // Component to update view when route path changes?
    // Simplified for now.

    return (
        <div className="h-full w-full z-0">
            <MapContainer center={[22.5937, 78.9629]} zoom={5} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme map
                />

                {geoData && (
                    <GeoJSON
                        key="crime-districts-v3" // Final V3 Key to force fresh mount
                        data={geoData}
                        style={style}
                        onEachFeature={onEachFeature}
                    />
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
            </MapContainer>
        </div>
    );
};

export default MapComponent;
