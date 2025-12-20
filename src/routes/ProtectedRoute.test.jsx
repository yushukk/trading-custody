import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock dependencies
jest.mock('../api/userApi');
jest.mock('../api/apiClient');

const MockAuthProvider = ({ user, loading, children }) => {
  const mockUseAuth = () => ({
    user,
    loading,
    login: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
  });

  // Mock useAuth hook
  jest.spyOn(require('../contexts/AuthContext'), 'useAuth').mockImplementation(mockUseAuth);

  return children;
};

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;
  const LoginComponent = () => <div>Login Page</div>;
  const UserDashboard = () => <div>User Dashboard</div>;

  const renderWithRouter = (ui, { user = null, loading = false, meta = {} } = {}) => {
    return render(
      <BrowserRouter>
        <MockAuthProvider user={user} loading={loading}>
          <Routes>
            <Route path="/login" element={<LoginComponent />} />
            <Route path="/user-fund-position" element={<UserDashboard />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute meta={meta}>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MockAuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '/protected');
  });

  it('should show loading state', () => {
    renderWithRouter(<TestComponent />, { loading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render children when no auth required', () => {
    renderWithRouter(<TestComponent />, { user: null, meta: {} });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when auth required but no user', () => {
    renderWithRouter(<TestComponent />, {
      user: null,
      meta: { requiresAuth: true },
    });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render children when auth required and user exists', () => {
    const user = { id: 1, name: 'Test User', role: 'user' };
    renderWithRouter(<TestComponent />, {
      user,
      meta: { requiresAuth: true },
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to user dashboard when admin required but user is not admin', () => {
    const user = { id: 1, name: 'Test User', role: 'user' };
    renderWithRouter(<TestComponent />, {
      user,
      meta: { requiresAuth: true, requiresAdmin: true },
    });
    expect(screen.getByText('User Dashboard')).toBeInTheDocument();
  });

  it('should render children when admin required and user is admin', () => {
    const user = { id: 1, name: 'Admin User', role: 'admin' };
    renderWithRouter(<TestComponent />, {
      user,
      meta: { requiresAuth: true, requiresAdmin: true },
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle missing meta object', () => {
    const user = { id: 1, name: 'Test User', role: 'user' };
    renderWithRouter(<TestComponent />, { user });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
