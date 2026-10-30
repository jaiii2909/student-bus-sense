import { useMemo, useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import { Loader2, Navigation, MapPin } from "lucide-react";

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  kind?: "bus" | "stop" | "myStop";
  label?: string;
  busNumber?: string;
  isLive?: boolean;
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  height?: string;
  routePath?: { lat: number; lng: number }[];
  onMapClick?: (position: { lat: number; lng: number }) => void;
  onMapLoad?: (map: google.maps.Map) => void;
}

const defaultCenter = {
  lat: 25.4358, // Prayagraj/Allahabad coordinates
  lng: 81.8463,
};

// High-tech SaaS Transit Bus Pin (Royal Blue & Cyan Telemetry)
const createBusPinIcon = (busNumber?: string, isLive: boolean = true) => {
  const primaryFill = isLive ? "#2563EB" : "#475569";
  const glowStroke = isLive ? "#06B6D4" : "#94A3B8";
  const labelText = busNumber ? busNumber.slice(0, 4) : "BUS";

  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${isLive ? 'rgba(6,182,212,0.45)' : 'rgba(0,0,0,0.25)'}"/>
        </filter>
      </defs>
      <!-- Outer Beacon Ring -->
      <circle cx="24" cy="24" r="21" fill="${isLive ? 'rgba(6,182,212,0.18)' : 'rgba(100,116,139,0.12)'}" stroke="${glowStroke}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <!-- Main Core Disc -->
      <circle cx="24" cy="24" r="16" fill="${primaryFill}" stroke="#FFFFFF" stroke-width="2" filter="url(#glow)"/>
      <!-- Bus Silhouette Glyph -->
      <path d="M18 16C18 15.4477 18.4477 15 19 15H29C29.5523 15 30 15.4477 30 16V25C30 25.5523 29.5523 26 29 26V28C29 28.5523 28.5523 29 28 29H27C26.4477 29 26 28.5523 26 28V26H22V28C22 28.5523 21.4477 29 21 29H20C19.4477 29 19 28.5523 19 28V26C18.4477 26 18 25.5523 18 25V16Z" fill="#FFFFFF"/>
      <rect x="20" y="17" width="8" height="3.5" rx="0.5" fill="${primaryFill}"/>
      <circle cx="21" cy="23.5" r="1.1" fill="#FFFFFF"/>
      <circle cx="27" cy="23.5" r="1.1" fill="#FFFFFF"/>
      <!-- Bus Number Badge -->
      <rect x="14" y="32" width="20" height="9" rx="3" fill="#0F172A" stroke="#38BDF8" stroke-width="1"/>
      <text x="24" y="38.5" text-anchor="middle" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="7" font-weight="bold" letter-spacing="0.5">${labelText}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" ? new google.maps.Size(48, 48) : undefined,
    anchor: typeof google !== "undefined" ? new google.maps.Point(24, 24) : undefined,
  };
};

// Route Stop Milestone Pin
const createStopPinIcon = (stopNumber?: number) => {
  const numberText = stopNumber !== undefined ? `${stopNumber}` : "";
  const svg = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="11" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/>
      <circle cx="14" cy="14" r="8" fill="#F1F5F9"/>
      <text x="14" y="17.5" text-anchor="middle" fill="#0F172A" font-family="system-ui, sans-serif" font-size="9" font-weight="800">${numberText}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" ? new google.maps.Size(28, 28) : undefined,
    anchor: typeof google !== "undefined" ? new google.maps.Point(14, 14) : undefined,
  };
};

// Student's Destination Stop Pin (Beacon Star)
const createMyStopPinIcon = () => {
  const svg = `
    <svg width="40" height="46" viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="beacon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(16,185,129,0.5)"/>
        </filter>
      </defs>
      <!-- Drop Pin Shape -->
      <path d="M20 0C8.9543 0 0 8.9543 0 20C0 32 17 44 20 46C23 44 40 32 40 20C40 8.9543 31.0457 0 20 0Z" fill="#10B981" filter="url(#beacon-glow)"/>
      <circle cx="20" cy="18" r="14" fill="#FFFFFF"/>
      <circle cx="20" cy="18" r="11" fill="#059669"/>
      <!-- Inner Target / Check Icon -->
      <path d="M16 18L19 21L24 15" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== "undefined" ? new google.maps.Size(36, 42) : undefined,
    anchor: typeof google !== "undefined" ? new google.maps.Point(18, 42) : undefined,
  };
};

// Premium Mobility-Tech Light Map Style
const lightMapStyles: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#eff6ff" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#bfdbfe" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
];

// Premium Obsidian Midnight Dark Map Style
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#090d16" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#090d16" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#162032" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2563eb" }, { weight: 1 }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#111827" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1527" }] },
];

// Smooth coordinate interpolation hook for moving GPS markers
const useInterpolatedPosition = (targetPos: { lat: number; lng: number } | undefined) => {
  const [currentPos, setCurrentPos] = useState(targetPos);
  const animRef = useRef<number | null>(null);
  const currentPosRef = useRef(targetPos);
  const startPosRef = useRef(targetPos);
  const targetPosRef = useRef(targetPos);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    currentPosRef.current = currentPos;
  }, [currentPos]);

  useEffect(() => {
    if (!targetPos) return;
    const prevPos = currentPosRef.current;
    if (!prevPos) {
      setCurrentPos(targetPos);
      startPosRef.current = targetPos;
      targetPosRef.current = targetPos;
      return;
    }

    // Only animate if coordinate moved slightly (less than ~0.05 degrees to avoid cross-country warping)
    const latDiff = Math.abs(targetPos.lat - prevPos.lat);
    const lngDiff = Math.abs(targetPos.lng - prevPos.lng);

    if (latDiff > 0.05 || lngDiff > 0.05) {
      setCurrentPos(targetPos);
      startPosRef.current = targetPos;
      targetPosRef.current = targetPos;
      return;
    }

    startPosRef.current = prevPos;
    targetPosRef.current = targetPos;
    startTimeRef.current = performance.now();
    const duration = 900; // 900ms smooth gliding interpolation

    const step = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      // smooth ease-out curve
      const ease = 1 - Math.pow(1 - progress, 3);

      if (startPosRef.current && targetPosRef.current) {
        const nextLat = startPosRef.current.lat + (targetPosRef.current.lat - startPosRef.current.lat) * ease;
        const nextLng = startPosRef.current.lng + (targetPosRef.current.lng - startPosRef.current.lng) * ease;
        setCurrentPos({ lat: nextLat, lng: nextLng });
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [targetPos?.lat, targetPos?.lng]);

  return currentPos;
};

// Individual animated bus marker
const AnimatedBusMarker = ({ marker }: { marker: MapMarker }) => {
  const interpolatedPos = useInterpolatedPosition(marker.position);
  const icon = useMemo(
    () => createBusPinIcon(marker.busNumber || marker.label, marker.isLive ?? true),
    [marker.busNumber, marker.label, marker.isLive]
  );

  if (!interpolatedPos) return null;

  return (
    <Marker
      position={interpolatedPos}
      title={marker.title}
      icon={icon}
      zIndex={100}
    />
  );
};

const MapView = ({
  center = defaultCenter,
  markers = [],
  zoom = 14,
  height = "100%",
  routePath,
  onMapClick,
  onMapLoad,
}: MapViewProps) => {
  const { resolvedTheme } = useTheme();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      styles: resolvedTheme === "dark" ? darkMapStyles : lightMapStyles,
      clickableIcons: !onMapClick,
      draggableCursor: onMapClick ? "crosshair" : undefined,
    }),
    [resolvedTheme, onMapClick]
  );

  const polylineOptions = useMemo(
    () => ({
      strokeColor: resolvedTheme === "dark" ? "#38BDF8" : "#2563EB",
      strokeOpacity: 0.85,
      strokeWeight: 4,
      geodesic: true,
    }),
    [resolvedTheme]
  );

  if (loadError) {
    return (
      <div className="h-full min-h-[320px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground bg-muted/50 border border-border/80 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
          <Navigation className="w-5 h-5" />
        </div>
        <p className="font-semibold text-foreground mb-1">Transit GPS Map Offline</p>
        <p className="max-w-xs">Unable to load satellite map grid. Please check network connectivity or API key configuration.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full min-h-[320px] flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded-xl">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 animate-ping absolute" />
          <Loader2 className="w-6 h-6 animate-spin text-primary relative z-10" />
        </div>
        <span className="font-medium tracking-wide">Syncing campus transit satellite telemetry...</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height, borderRadius: "inherit" }}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onLoad={onMapLoad}
      onClick={
        onMapClick
          ? (e) => {
              if (e.latLng) onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
          : undefined
      }
    >
      {/* Optional Route Polyline */}
      {routePath && routePath.length > 1 && (
        <Polyline path={routePath} options={polylineOptions} />
      )}

      {/* Markers */}
      {markers.map((marker, index) => {
        if (marker.kind === "bus") {
          return <AnimatedBusMarker key={marker.id} marker={marker} />;
        }

        if (marker.kind === "myStop") {
          return (
            <Marker
              key={marker.id}
              position={marker.position}
              title={marker.title}
              icon={createMyStopPinIcon()}
              zIndex={90}
            />
          );
        }

        // Regular Stop
        return (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            icon={createStopPinIcon(index + 1)}
            zIndex={50}
          />
        );
      })}
    </GoogleMap>
  );
};

export default MapView;
