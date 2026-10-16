import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
}

const defaultCenter = {
  lat: 25.4358, // Prayagraj/Allahabad coordinates
  lng: 81.8463,
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
  `)}`,
};

const MapView = ({ center = defaultCenter, markers = [], zoom = 14, height = "100%" }: MapViewProps) => {
  // loads the Maps script once, even if the map is mounted again
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (loadError) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center text-sm text-gray-500">
        Map could not be loaded. Check your internet connection.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center text-sm text-gray-500">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap mapContainerStyle={{ width: "100%", height }} center={center} zoom={zoom}>
      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position} title={marker.title} icon={busIcon} />
      ))}
    </GoogleMap>
  );
};

export default MapView;
