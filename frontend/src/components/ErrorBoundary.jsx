import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="glass-panel p-8 max-w-md text-center flex flex-col gap-4">
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted">
              The page encountered an error. Please reload or sign in again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
