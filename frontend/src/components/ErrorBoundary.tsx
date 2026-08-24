import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Error boundaries have no hook equivalent — this must be a class
// component. Without one, any unhandled render error unmounts the whole
// React tree to a blank white screen with no recovery path.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in component tree:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="signin-screen">
          <div className="signin-card">
            <h1>Something went wrong</h1>
            <p className="subtitle">
              The dashboard hit an unexpected error. Reloading usually fixes it.
            </p>
            <button
              type="button"
              className="signin-button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
