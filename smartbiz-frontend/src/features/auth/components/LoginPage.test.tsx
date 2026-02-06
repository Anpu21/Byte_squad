import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import { store } from '../../../store';

// Mock dependencies
vi.mock('@store/hooks', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: () => ({ isLoading: false, error: null }),
}));

describe('LoginPage', () => {
    const renderComponent = () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <LoginPage />
                </BrowserRouter>
            </Provider>
        );
    };

    it('renders login form correctly', () => {
        renderComponent();
        expect(screen.getByText(/sign in to your ledgerpro account/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    it('handles password visibility toggle', () => {
        renderComponent();
        const passwordInput = screen.getByPlaceholderText(/password/i);
        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleButton = screen.getByRole('button', { name: /toggle password/i });
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
    });

    // Add more tests as needed
});
