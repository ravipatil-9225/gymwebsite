import { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * ErrorBoundary — Catches any React rendering crash and shows a
 * friendly fallback page instead of a blank white screen.
 *
 * Usage: Wrap your <App /> in <ErrorBoundary> in main.jsx
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorMessage: error?.message || 'Unknown error' };
    }

    componentDidCatch(error, info) {
        // Only log in non-production environments
        if (import.meta.env.MODE !== 'production') {
            console.error('[ErrorBoundary] Caught error:', error, info);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, errorMessage: '' });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center">
                    {/* Glow background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

                    <div className="relative z-10 max-w-lg w-full">
                        {/* Icon */}
                        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                            Something went wrong
                        </h1>
                        <p className="text-gray-400 mb-10 leading-relaxed">
                            A part of the page crashed unexpectedly. Your data is safe.
                            Try refreshing or go back to the homepage.
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/10 transition-all"
                            >
                                Try Again
                            </button>
                            <Link
                                to="/home"
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-primary hover:bg-yellow-500 text-black font-bold rounded-lg transition-all shadow-lg shadow-primary/20"
                            >
                                Back to Homepage
                            </Link>
                        </div>

                        {/* Dev-only error details */}
                        {import.meta.env.MODE !== 'production' && this.state.errorMessage && (
                            <div className="mt-10 text-left bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    <span className="text-red-500 font-bold">Error: </span>
                                    {this.state.errorMessage}
                                </p>
                                <p className="text-gray-600 text-xs mt-2 font-mono">
                                    (This message is hidden in production)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
