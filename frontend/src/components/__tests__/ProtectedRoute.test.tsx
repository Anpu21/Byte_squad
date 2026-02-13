import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import type { RootState } from '@/store';
import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Helper — renders the component with Redux Provider and Router.
 */
function renderWithProviders(
    preloadedState: Partial<RootState>,
    children: React.ReactElement = <div>Protected Content</div>,
) {
    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState,
    });

    return render(
        <Provider store={store}>
            <MemoryRouter>
                <ProtectedRoute>{children}</ProtectedRoute>
            </MemoryRouter>
        </Provider>,
    );
}

describe('ProtectedRoute', () => {
    it('renders children when user is authenticated', () => {
        renderWithProviders({
            auth: {
                user: { id: '1', username: 'admin', role: 'admin' },
                token: 'valid-token',
                isLoading: false,
                error: null,
            },
        });

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to /login when user is NOT authenticated', () => {
        renderWithProviders({
            auth: { user: null, token: null, isLoading: false, error: null },
        });

        // The protected content should NOT be visible
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects when token is explicitly null', () => {
        renderWithProviders({
            auth: { user: null, token: null, isLoading: false, error: null },
        });

        expect(screen.queryByText('Protected Content')).toBeNull();
    });
});
