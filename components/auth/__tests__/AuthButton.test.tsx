/**
 * Component tests for AuthButton
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthButton } from '../AuthButton';
import { SessionProvider } from 'next-auth/react';

// Mock next-auth
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react');
  return {
    ...actual,
    useSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

import { useSession, signIn, signOut } from 'next-auth/react';

const mockUseSession = useSession as ReturnType<typeof vi.fn>;
const mockSignIn = signIn as ReturnType<typeof vi.fn>;
const mockSignOut = signOut as ReturnType<typeof vi.fn>;

describe('AuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when session is loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    
    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show sign in and sign up buttons when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    
    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('should show user email and sign out button when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    });
    
    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should show user name if available', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    });
    
    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should call signOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    });
    mockSignOut.mockResolvedValue(undefined);
    
    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );
    
    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should show OAuth buttons when configured', () => {
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-id';
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'test-github-id';
    
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    
    render(
      <SessionProvider>
        <AuthButton />
      </SessionProvider>
    );
    
    // Check for OAuth buttons (they might be rendered)
    const buttons = screen.getAllByRole('button');
    const hasGoogle = buttons.some(btn => btn.textContent?.includes('Google'));
    const hasGitHub = buttons.some(btn => btn.textContent?.includes('GitHub'));
    
    // OAuth buttons should be present if env vars are set
    if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      expect(hasGoogle).toBe(true);
    }
    if (process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID) {
      expect(hasGitHub).toBe(true);
    }
  });
});

