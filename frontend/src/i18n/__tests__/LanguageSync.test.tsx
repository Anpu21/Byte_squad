import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setUser } from '@/store/slices/authSlice';

const changeLanguage = vi.fn();
vi.mock('@/i18n', () => ({
    default: { language: 'en', changeLanguage: (l: string) => changeLanguage(l) },
}));

import { LanguageSync } from '../LanguageSync';

interface MockUser {
    id: string;
    language?: string;
}

function makeStore(user: MockUser | null) {
    return configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
            auth: {
                user: user as never,
                token: user ? 'tok' : null,
                isAuthenticated: !!user,
                isLoading: false,
                error: null,
            },
        },
    });
}

describe('LanguageSync', () => {
    beforeEach(() => changeLanguage.mockReset());

    it('applies the profile language once on login', () => {
        const store = makeStore({ id: 'u1', language: 'ta' });
        render(
            <Provider store={store}>
                <LanguageSync />
            </Provider>,
        );
        expect(changeLanguage).toHaveBeenCalledTimes(1);
        expect(changeLanguage).toHaveBeenCalledWith('ta');
    });

    it('never reverts the live language when a later refetch flips auth.user.language', () => {
        const store = makeStore({ id: 'u1', language: 'ta' });
        render(
            <Provider store={store}>
                <LanguageSync />
            </Provider>,
        );
        changeLanguage.mockReset();
        // Simulate a profile refetch / mutation overwriting the cached user
        // with a stale language — the live i18n language must NOT change.
        store.dispatch(setUser({ language: 'en' }));
        expect(changeLanguage).not.toHaveBeenCalled();
    });

    it('does nothing for an anonymous (logged-out) state', () => {
        const store = makeStore(null);
        render(
            <Provider store={store}>
                <LanguageSync />
            </Provider>,
        );
        expect(changeLanguage).not.toHaveBeenCalled();
    });
});
