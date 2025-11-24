/**
 * Error Boundary component for catching React errors
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--dpgen-text)',
            background: 'var(--dpgen-bg)',
            borderRadius: 'var(--dpgen-radius)',
            border: '2px solid #ef4444',
            margin: '2rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}>
            <i className="fas fa-exclamation-triangle" />
          </div>
          <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--dpgen-muted)' }}>
            An error occurred while rendering this component.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                textAlign: 'left',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 600 }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#ef4444',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--dpgen-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

