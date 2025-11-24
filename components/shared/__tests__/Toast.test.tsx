/**
 * Component tests for Toast notification system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

// Test component that uses useToast
function TestComponent() {
  const { showToast, removeToast, toasts } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Warning message', 'warning')}>
        Show Warning
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      {toasts.map(toast => (
        <button key={toast.id} onClick={() => removeToast(toast.id)}>
          Remove {toast.id}
        </button>
      ))}
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render children', () => {
    render(
      <ToastProvider>
        <div>Test Content</div>
      </ToastProvider>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show toast when showToast is called', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Success');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should show different toast types', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));
    await user.click(screen.getByText('Show Warning'));
    await user.click(screen.getByText('Show Info'));
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  it('should auto-remove toast after duration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    // Fast-forward time
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('should remove toast when removeToast is called', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
    
    // Find and click remove button
    const removeButtons = screen.getAllByText(/Remove/);
    await user.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('should handle multiple toasts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));
    
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });
});

describe('useToast', () => {
  it('should throw error when used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');
    
    consoleSpy.mockRestore();
  });
});

