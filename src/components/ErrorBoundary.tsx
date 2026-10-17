import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  // compact = inline box (e.g. inside the map card) instead of a full page
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Shows "Something went wrong, reload" instead of a blank screen when a child crashes.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className={`flex items-center justify-center p-6 text-center bg-background text-foreground ${
          this.props.compact ? "h-full min-h-[300px]" : "min-h-screen"
        }`}
      >
        <div className="space-y-3 max-w-xs">
          <p className="text-sm font-bold">Something went wrong</p>
          <p className="text-xs text-muted-foreground">Please reload the page. If it keeps happening, contact the transport desk.</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
