import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected UI error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application UI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {this.state.errorMessage || 'A display error interrupted this view.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRecover}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Try Returning
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
