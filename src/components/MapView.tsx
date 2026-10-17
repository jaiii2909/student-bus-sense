import { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

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

// Authentic School Bus Yellow / Amber Transit Marker
const campusBusPinIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#D97706" stroke="#1C1917" stroke-width="2"/>
      <path d="M13 13C13 12.4477 13.4477 12 14 12H26C26.5523 12 27 12.4477 27 13V22C27 23.1046 26.1046 24 25 24V26C25 26.5523 24.5523 27 24 27H23C22.4477 27 22 26.5523 22 26V24H18V26C18 26.5523 17.4477 27 17 27H16C15.4477 27 15 26.5523 15 26V24C13.8954 24 13 23.1046 13 22V13Z" fill="#1C1917"/>
      <rect x="15" y="14" width="10" height="4.5" rx="0.5" fill="#FAF9F5"/>
      <circle cx="16" cy="21.5" r="1.2" fill="#FAF9F5"/>
      <circle cx="24" cy="21.5" r="1.2" fill="#FAF9F5"/>
    </svg>
  `)}`,
};

// Muted Transit Map Style (Warm institutional day style)
const lightMapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 20 }, { visibility: "simplified" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#dbeafe" }],
  },
];

// Dark Stone Transit Map Style
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1c1917" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1c1917" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a8a29e" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#292524" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
];

const MapView = ({ center = defaultCenter, markers = [], zoom = 14, height = "100%" }: MapViewProps) => {
  const { resolvedTheme } = useTheme();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    zoomControl: true,
    styles: resolvedTheme === "dark" ? darkMapStyles : lightMapStyles,
  }), [resolvedTheme]);

  if (loadError) {
    return (
      <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground bg-stone-50 dark:bg-stone-900 border border-border">
        <p className="font-semibold text-foreground mb-1">Transit GPS Map Offline</p>
        <p>Check connection or campus network gateway settings.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-stone-50 dark:bg-stone-900">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Loading Prayagraj campus transit grid...</span>
      </div>
    );
  }

  return (
    <GoogleMap 
      mapContainerStyle={{ width: "100%", height }} 
      center={center} 
      zoom={zoom}
      options={mapOptions}
    >
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={marker.position} 
          title={marker.title} 
          icon={campusBusPinIcon} 
        />
      ))}
    </GoogleMap>
  );
};

export default MapView;
