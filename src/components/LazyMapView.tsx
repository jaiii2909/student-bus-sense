import { ComponentProps, Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";

// Google Maps code is only downloaded when a map is actually shown.
const MapView = lazy(() => import("./MapView"));

type MapViewProps = ComponentProps<typeof import("./MapView").default>;

const MapLoading = () => (
  <div className="h-full min-h-[300px] flex items-center justify-center text-muted-foreground">
    <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden="true" />
  </div>
);

// Same props as MapView; a map crash only replaces the map, not the page.
const LazyMapView = (props: MapViewProps) => (
  <ErrorBoundary compact>
    <Suspense fallback={<MapLoading />}>
      <MapView {...props} />
    </Suspense>
  </ErrorBoundary>
);

export default LazyMapView;
