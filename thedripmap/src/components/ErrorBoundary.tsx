'use client';
import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFDFB]">
          <Navbar />
          <div className="max-w-7xl mx-auto px-6 py-32 text-center">
            <h1 className="text-4xl font-black text-slate-900 mb-6">Something went wrong</h1>
            <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
              We&apos;re sorry, but there was an error rendering this page. Our team has been notified.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-wellness-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-wellness-700 transition-all shadow-lg"
            >
              Reload Page
            </button>
          </div>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}
