import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const defaultCenter = {
  lat: 25.4358,   // Prayagraj/Allahabad coordinates
  lng: 81.8463,
};

const MapView = ({ center = defaultCenter, markers = [], zoom = 14, height = "100%" }) => {
  const containerStyle = {
    width: "100%",
    height: height,
  };

  // Custom bus icon using inline SVG
  const busIcon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="6" width="20" height="12" rx="2" fill="#2563eb" stroke="#1e40af" stroke-width="1"/>
        <rect x="4" y="8" width="5" height="8" fill="#ffffff"/>
        <rect x="11" y="8" width="5" height="8" fill="#ffffff"/>
        <circle cx="6" cy="20" r="2" fill="#374151"/>
        <circle cx="18" cy="20" r="2" fill="#374151"/>
        <rect x="1" y="10" width="1" height="4" fill="#dc2626"/>
        <rect x="22" y="10" width="1" height="4" fill="#dc2626"/>
      </svg>
    `)}`
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
      >
        {/* Default marker if no markers provided */}
        {markers.length === 0 && <Marker position={center} icon={busIcon} />}

        {/* Render provided markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            title={marker.title}
            icon={busIcon}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;
